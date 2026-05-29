const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const chatService = require('../services/chatService');
const Conversation = require('../models/Conversation');

// In-memory track of online users and active admin sockets
const onlineUsers = new Map(); // userId -> { socketId, role, name }
const activeConversations = new Map(); // conversationId -> Set of online userIds in it

function initSocket(server) {
    const io = socketIO(server, {
        cors: {
            origin: function (origin, callback) {
                // Đọc danh sách tên miền cho phép từ biến môi trường
                const allowedOrigins = process.env.FRONTEND_URL 
                    ? process.env.FRONTEND_URL.split(',') 
                    : ['http://localhost:3000', 'http://127.0.0.1:3000'];
                
                // Cho phép nếu không có origin (VD: Postman) hoặc origin nằm trong danh sách
                if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // 1. Socket Authentication Middleware
    io.use(async (socket, next) => {
        try {
            let token = socket.handshake.auth?.token || socket.handshake.query?.token;

            if (!token && socket.handshake.headers.cookie) {
                const cookies = socket.handshake.headers.cookie.split(';');
                const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
                if (tokenCookie) {
                    token = tokenCookie.split('=')[1];
                }
            }

            if (token && token.startsWith('Bearer ')) {
                token = token.slice(7);
            }

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    // 2. Main Connection Handler
    io.on('connection', (socket) => {
        const user = socket.user;
        const userId = user._id.toString();
        const role = user.role.toUpperCase(); // 'CUSTOMER' or 'ADMIN'

        // Track online status
        onlineUsers.set(userId, {
            socketId: socket.id,
            role,
            name: user.name,
            avatar: user.avatar
        });

        // Broadcast user_online to all connected clients
        io.emit('user_online', { userId, role, name: user.name });

        console.log(`🔌 Live Chat: ${user.name} (${role}) connected on socket ${socket.id}`);

        // --- Event: JOIN CONVERSATION ---
        socket.on('join_conversation', async ({ conversationId }) => {
            try {
                if (!conversationId) return;

                const conversation = await Conversation.findById(conversationId);
                if (!conversation) {
                    return socket.emit('error', { message: 'Conversation not found' });
                }

                // Security check: Customer can only join their own conversation
                if (role !== 'ADMIN' && conversation.customerId.toString() !== userId) {
                    return socket.emit('error', { message: 'Unauthorized access to this conversation' });
                }

                // Join socket room
                socket.join(conversationId);
                console.log(`💬 User ${user.name} joined conversation room: ${conversationId}`);

                // Track active users in conversation
                if (!activeConversations.has(conversationId)) {
                    activeConversations.set(conversationId, new Set());
                }
                activeConversations.get(conversationId).add(userId);

                // Notify others in room
                socket.to(conversationId).emit('user_online_in_chat', { userId, role });

                // If reader joins, automatically mark messages from opposite sender as read
                await chatService.markMessagesAsRead(conversationId, role);
                io.to(conversationId).emit('message_read', { conversationId, role });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // --- Event: LEAVE CONVERSATION ---
        socket.on('leave_conversation', ({ conversationId }) => {
            if (!conversationId) return;
            socket.leave(conversationId);
            console.log(`🚪 User ${user.name} left conversation room: ${conversationId}`);

            if (activeConversations.has(conversationId)) {
                activeConversations.get(conversationId).delete(userId);
                if (activeConversations.get(conversationId).size === 0) {
                    activeConversations.delete(conversationId);
                }
            }
        });

        // --- Event: SEND MESSAGE (Customer or Admin) ---
        socket.on('send_message', async ({ conversationId, content, messageType = 'TEXT' }) => {
            try {
                if (!content || !content.trim()) return;

                const conversation = await Conversation.findById(conversationId);
                if (!conversation) {
                    return socket.emit('error', { message: 'Conversation not found' });
                }

                // Security check: Customer can only send to their own conversation
                if (role !== 'ADMIN' && conversation.customerId.toString() !== userId) {
                    return socket.emit('error', { message: 'Unauthorized to send message' });
                }

                // Save message via service layer
                const message = await chatService.saveMessage(
                    conversationId,
                    userId,
                    role,
                    messageType,
                    content.trim()
                );

                // Check if other party is active in this room
                let isRead = false;
                const members = activeConversations.get(conversationId);
                if (members) {
                    // Check if opposite role is active in the chat room
                    for (const memberId of members) {
                        const memberInfo = onlineUsers.get(memberId);
                        if (memberInfo && memberInfo.role !== role) {
                            isRead = true;
                            break;
                        }
                    }
                }

                if (isRead) {
                    message.isRead = true;
                    await message.save();
                    // Reset unread count
                    await Conversation.findByIdAndUpdate(conversationId, { unreadCount: 0 });
                }

                // Prepare payload with populated sender details for instant render
                const messagePayload = {
                    ...message.toObject(),
                    sender: {
                        _id: user._id,
                        name: user.name,
                        avatar: user.avatar
                    }
                };

                // Broadcast message to room members
                io.to(conversationId).emit('receive_message', messagePayload);

                // For Admin dashboard list view update: emit a system event so admin knows there's a new message
                io.emit('conversation_updated', {
                    conversationId,
                    lastMessage: content,
                    lastMessageAt: message.createdAt,
                    unreadCount: isRead ? 0 : 1,
                    customerId: conversation.customerId
                });

            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // --- Event: TYPING & STOP TYPING ---
        socket.on('typing', ({ conversationId }) => {
            socket.to(conversationId).emit('typing', { conversationId, userId, role, name: user.name });
        });

        socket.on('stop_typing', ({ conversationId }) => {
            socket.to(conversationId).emit('stop_typing', { conversationId, userId, role });
        });

        // --- Event: DISCONNECT ---
        socket.on('disconnect', () => {
            onlineUsers.delete(userId);
            io.emit('user_offline', { userId, role });
            console.log(`🔌 Live Chat: ${user.name} (${role}) disconnected`);

            // Clean up active conversations membership
            activeConversations.forEach((membersSet, convId) => {
                if (membersSet.has(userId)) {
                    membersSet.delete(userId);
                    if (membersSet.size === 0) {
                        activeConversations.delete(convId);
                    }
                }
            });
        });
    });

    return io;
}

module.exports = { initSocket, onlineUsers };
