const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['CUSTOMER', 'ADMIN'],
        required: true
    },
    messageType: {
        type: String,
        enum: ['TEXT', 'IMAGE'],
        default: 'TEXT'
    },
    content: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
