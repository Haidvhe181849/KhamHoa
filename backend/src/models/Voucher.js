const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED'],
        default: 'PERCENTAGE'
    },
    discountValue: {
        type: Number,
        required: true
    },
    maxDiscount: {
        type: Number, // Limit for PERCENTAGE discount
        default: null
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    expiryDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: 100 // Total times this voucher can be used
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
