const chatService = require('../services/chatService');
const Conversation = require('../models/Conversation');

// 1. Get or create current customer's conversation
exports.getCustomerConversation = async (req, res) => {
    try {
        const customerId = req.user.id;
        const conversation = await chatService.getOrCreateConversation(customerId);
        const messages = await chatService.getMessages(conversation._id);

        res.status(200).json({
            success: true,
            data: {
                conversation,
                messages
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Get messages of a specific conversation (with security verification)
exports.getConversationMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await Conversation.findById(id);

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc hội thoại' });
        }

        // Validate Ownership: Customer can only view their own conversation
        if (req.user.role !== 'admin' && conversation.customerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập cuộc hội thoại này'
            });
        }

        const messages = await chatService.getMessages(id);
        
        // Mark as read when messages are loaded
        const role = req.user.role === 'admin' ? 'ADMIN' : 'CUSTOMER';
        await chatService.markMessagesAsRead(id, role);

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Mark a conversation as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await Conversation.findById(id);

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc hội thoại' });
        }

        // Validate Ownership
        if (req.user.role !== 'admin' && conversation.customerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }

        const role = req.user.role === 'admin' ? 'ADMIN' : 'CUSTOMER';
        await chatService.markMessagesAsRead(id, role);

        res.status(200).json({
            success: true,
            message: 'Đã đánh dấu là đã đọc'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Admin only: Get all conversations
exports.getAllConversations = async (req, res) => {
    try {
        const conversations = await chatService.getAllConversations();
        res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Admin only: Close a conversation
exports.closeConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await chatService.closeConversation(id);

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc hội thoại' });
        }

        res.status(200).json({
            success: true,
            message: 'Đã đóng cuộc hội thoại thành công',
            data: conversation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Admin only: Open a conversation
exports.openConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await chatService.openConversation(id);

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc hội thoại' });
        }

        res.status(200).json({
            success: true,
            message: 'Đã mở lại cuộc hội thoại thành công',
            data: conversation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
