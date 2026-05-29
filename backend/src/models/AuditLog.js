const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    adminName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    targetModel: {
        type: String, // 'Order', 'Product', 'Voucher', 'User'
        required: true,
        index: true
    },
    targetId: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
