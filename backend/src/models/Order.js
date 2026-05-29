const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        index: true
    },
    // Customer Info
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        index: true,
        default: null  // null = guest order (đặt hàng không cần đăng nhập)
    },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    note: { type: String },


    // Order Items (Snapshots)
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true }, // Snapshot name
        image: { type: String },               // Snapshot image
        price: { type: Number, required: true, min: 0 }, // Snapshot price at purchase time
        quantity: { type: Number, required: true, min: 1 },
        subtotal: { type: Number, required: true, min: 0 },
        isReviewed: { type: Boolean, default: false }
    }],

    // Pricing
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 30000 },
    voucherCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    cancelReason: { type: String, default: null },

    // Statuses
    orderStatus: { 
        type: String, 
        enum: ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'], 
        default: 'PENDING',
        index: true
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING',
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'BANK_TRANSFER', 'VNPAY', 'MOMO', 'QR'],
        default: 'COD'
    },
    shippingMethod: {
        type: String,
        default: 'Giao hàng tiêu chuẩn'
    },

    // Tracking
    timeline: [{
        status: String,
        time: { type: Date, default: Date.now },
        note: String
    }],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Index cho tìm kiếm nhanh
orderSchema.index({ customerName: 'text', phone: 'text', orderCode: 'text' });

// Middleware xử lý tương thích ngược cho dữ liệu cũ (Legacy Data Patching)
orderSchema.pre('validate', function() {
    // Nếu đơn cũ chưa có orderCode
    if (!this.orderCode) {
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.orderCode = `KH-LEGACY-${date}-${random}`;
    }
    
    // Nếu đơn cũ thiếu subtotal chung
    if (!this.subtotal) {
        this.subtotal = this.totalAmount || 0;
    }

    // Vá lỗi thiếu snapshot trong danh sách sản phẩm của đơn cũ
    if (this.items && this.items.length > 0) {
        this.items.forEach(item => {
            if (!item.name) item.name = 'Sản phẩm phiên bản cũ';
            if (!item.price) item.price = 0;
            if (!item.subtotal) item.subtotal = item.price * (item.quantity || 1);
        });
    }
});

module.exports = mongoose.model('Order', orderSchema);
