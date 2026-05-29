const Voucher = require('../models/Voucher');

// 1. Lấy tất cả voucher (Admin/Public)
exports.getAllVouchers = async (req, res) => {
    try {
        const query = req.user && req.user.role === 'admin' ? {} : { isActive: true, expiryDate: { $gt: new Date() } };
        const vouchers = await Voucher.find(query).sort('-createdAt');
        res.status(200).json({ success: true, data: vouchers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Tạo mới voucher (Admin)
exports.createVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.create(req.body);
        res.status(201).json({ success: true, data: voucher });
    } catch (error) {
        res.status(400).json({ success: false, message: error.code === 11000 ? 'Mã voucher đã tồn tại' : error.message });
    }
};

// 3. Xóa voucher (Admin)
exports.deleteVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findByIdAndDelete(req.params.id);
        if (!voucher) throw new Error('Không tìm thấy voucher');
        res.status(200).json({ success: true, message: 'Đã xóa voucher' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 3.1 Cập nhật voucher (Admin)
exports.updateVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!voucher) throw new Error('Không tìm thấy voucher');
        res.status(200).json({ success: true, data: voucher });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 4. Validate và Apply Voucher (Public)
exports.applyVoucher = async (req, res) => {
    try {
        const { code, orderValue } = req.body;
        
        if (!code) throw new Error('Vui lòng nhập mã voucher');

        const voucher = await Voucher.findOne({ code: code.toUpperCase() });

        if (!voucher) {
            throw new Error('Mã voucher không tồn tại');
        }

        if (!voucher.isActive) {
            throw new Error('Mã voucher đã bị khóa');
        }

        if (new Date() > new Date(voucher.expiryDate)) {
            throw new Error('Mã voucher đã hết hạn');
        }

        if (voucher.usedCount >= voucher.usageLimit) {
            throw new Error('Mã voucher đã hết lượt sử dụng');
        }

        if (orderValue < voucher.minOrderValue) {
            throw new Error(`Đơn hàng phải từ ${voucher.minOrderValue.toLocaleString()} VNĐ để áp dụng mã này`);
        }

        // Tính toán số tiền giảm
        let discountAmount = 0;
        if (voucher.discountType === 'FIXED') {
            discountAmount = voucher.discountValue;
        } else if (voucher.discountType === 'PERCENTAGE') {
            discountAmount = (orderValue * voucher.discountValue) / 100;
            if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
                discountAmount = voucher.maxDiscount;
            }
        }

        // Không cho giảm quá giá trị đơn hàng
        if (discountAmount > orderValue) {
            discountAmount = orderValue;
        }

        res.status(200).json({ 
            success: true, 
            data: {
                voucherId: voucher._id,
                code: voucher.code,
                discountAmount: discountAmount,
                description: voucher.description
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
