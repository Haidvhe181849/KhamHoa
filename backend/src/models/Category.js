const mongoose = require('mongoose');
const { MENU_GROUPS } = require('../constants/menuGroups');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên danh mục'],
        unique: true,
        trim: true,
        maxlength: [50, 'Tên danh mục không được vượt quá 50 ký tự']
    },
    slug: String,
    description: {
        type: String,
        maxlength: [500, 'Mô tả danh mục không được vượt quá 500 ký tự']
    },
    menuGroup: {
        type: String,
        enum: {
            values: MENU_GROUPS,
            message: 'Nhóm menu phải là TRANG_SUC, PHU_KIEN hoặc QUA_TANG'
        },
        required: [true, 'Vui lòng chọn nhóm menu (Trang sức / Phụ kiện / Quà tặng)']
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    showInMenu: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

categorySchema.index({ menuGroup: 1, displayOrder: 1 });

categorySchema.pre('save', async function() {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
});

module.exports = mongoose.model('Category', categorySchema);
