const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
    // Người gửi
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        index: true
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerPhone: { type: String },

    // Nội dung yêu cầu
    category: {
        type: String,
        enum: ['order', 'product', 'warranty', 'other'],
        default: 'other'
    },
    subject: { type: String, required: true },  // Tự động map từ category
    detail: { type: String, required: true },

    // Trạng thái xử lý
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'RESOLVED', 'CLOSED'],
        default: 'PENDING',
        index: true
    },

    // Admin phản hồi
    adminNote: { type: String, default: '' },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

// Index tìm kiếm
supportRequestSchema.index({ customerName: 'text', detail: 'text' });

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
