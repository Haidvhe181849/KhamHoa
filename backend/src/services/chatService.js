const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

class ChatService {
    /**
     * Get or create an open conversation for a customer
     */
    async getOrCreateConversation(customerId) {
        let conversation = await Conversation.findOne({
            customerId,
            status: 'OPEN'
        });

        if (!conversation) {
            conversation = await Conversation.create({
                customerId,
                status: 'OPEN',
                unreadCount: 0
            });
        }
        return conversation;
    }

    /**
     * Get messages for a specific conversation
     */
    async getMessages(conversationId) {
        return await Message.find({ conversationId })
            .sort({ createdAt: 1 });
    }

    /**
     * Save a new message and update conversation status
     */
    async saveMessage(conversationId, senderId, senderRole, messageType, content) {
        // 1. Create message
        const message = await Message.create({
            conversationId,
            senderId,
            senderRole,
            messageType,
            content,
            isRead: false
        });

        // 2. Update conversation with last message details
        const updateData = {
            lastMessage: content,
            lastMessageAt: message.createdAt
        };

        // Increment unreadCount if needed
        await Conversation.findByIdAndUpdate(conversationId, {
            $set: updateData,
            $inc: { unreadCount: 1 }
        });

        return message;
    }

    /**
     * Mark all messages in conversation as read
     */
    async markMessagesAsRead(conversationId, readerRole) {
        // If customer is reading, mark ADMIN messages as read
        // If admin is reading, mark CUSTOMER messages as read
        const senderRoleToMark = readerRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';

        await Message.updateMany(
            { conversationId, senderRole: senderRoleToMark, isRead: false },
            { $set: { isRead: true } }
        );

        // Reset unread count for conversation
        await Conversation.findByIdAndUpdate(conversationId, {
            $set: { unreadCount: 0 }
        });
    }

    /**
     * Get all conversations (for admin dashboard)
     */
    async getAllConversations() {
        return await Conversation.find()
            .populate('customerId', 'name email avatar phone')
            .sort({ lastMessageAt: -1 });
    }

    /**
     * Get customer conversations
     */
    async getCustomerConversations(customerId) {
        return await Conversation.find({ customerId })
            .sort({ lastMessageAt: -1 });
    }

    /**
     * Close a conversation
     */
    async closeConversation(conversationId) {
        return await Conversation.findByIdAndUpdate(
            conversationId,
            { $set: { status: 'CLOSED' } },
            { new: true }
        );
    }

    /**
     * Reopen a conversation
     */
    async openConversation(conversationId) {
        return await Conversation.findByIdAndUpdate(
            conversationId,
            { $set: { status: 'OPEN' } },
            { new: true }
        );
    }
}

module.exports = new ChatService();
