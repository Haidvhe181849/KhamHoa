const express = require('express');
const router = express.Router();
const {
    getCustomerConversation,
    getConversationMessages,
    markAsRead,
    getAllConversations,
    closeConversation,
    openConversation
} = require('../controllers/chatController');
const { protect, authorize } = require('../middlewares/auth');

// ==========================================
// Customer & Shared Routes (Requires login)
// ==========================================
router.get('/conversation', protect, getCustomerConversation);
router.get('/conversation/:id/messages', protect, getConversationMessages);
router.put('/conversation/:id/read', protect, markAsRead);

// ==========================================
// Admin Only Routes
// ==========================================
router.get('/admin/conversations', protect, authorize('admin'), getAllConversations);
router.put('/admin/conversation/:id/close', protect, authorize('admin'), closeConversation);
router.put('/admin/conversation/:id/open', protect, authorize('admin'), openConversation);

module.exports = router;
