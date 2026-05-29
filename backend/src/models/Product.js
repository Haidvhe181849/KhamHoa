const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên sản phẩm'],
        trim: true,
        minlength: [3, 'Tên sản phẩm phải có ít nhất 3 ký tự'],
        maxlength: [200, 'Tên sản phẩm không được vượt quá 200 ký tự']
    },
    slug: String,
    price: {
        type: Number,
        required: [true, 'Vui lòng nhập giá sản phẩm'],
        min: [0, 'Giá sản phẩm không thể nhỏ hơn 0']
    },
    stock: {
        type: Number,
        required: [true, 'Vui lòng nhập số lượng tồn kho'],
        min: [0, 'Số lượng tồn kho không thể nhỏ hơn 0'],
        default: 0
    },
    sold: {
        type: Number,
        default: 0,
        min: [0, 'Số lượng đã bán không thể nhỏ hơn 0']
    },
    description: {
        type: String,
        required: [true, 'Vui lòng nhập mô tả sản phẩm']
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Vui lòng chọn danh mục cho sản phẩm']
    },
    images: [
        {
            url: String,
            publicId: String
        }
    ],
    rating: {
        type: Number,
        default: 0
    },
    reviewsCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware để tạo slug tự động
productSchema.pre('save', async function() {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
});

module.exports = mongoose.model('Product', productSchema);
