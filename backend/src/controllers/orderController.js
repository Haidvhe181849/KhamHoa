const Order = require('../models/Order');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');
const { sendTelegramMessage } = require('../utils/telegram');

// Helper sinh mã đơn hàng chuyên nghiệp: KH-150526-XXXX
const generateOrderCode = () => {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `KH-${date}-${random}`;
};

// ============================================================
// INVENTORY TIMING STRATEGY (Best Practice Ecommerce)
// ============================================================
// PENDING   → Chỉ ghi nhận đơn, KHÔNG trừ kho
//             → Lý do: Tránh "giữ hàng ảo" cho những đơn chưa chắc chắn
//
// CONFIRMED → TRỪ KHO tại đây (đơn đã được Admin xác nhận)
//             → Nếu hủy sau CONFIRMED → HOÀN KHO
//
// SHIPPING  → Không thể hủy (hàng đã giao cho shipper)
// DELIVERED → Không thể hủy (đã hoàn tất)
//
// CUSTOMER cancel rule: CHỈ ĐƯỢC HỦY khi PENDING
//   → Lý do: PENDING chưa trừ kho nên không cần rollback inventory
//   → Đây là điểm đơn giản nhất trong lifecycle
// ============================================================

// 1. Tạo đơn hàng
exports.createOrder = async (req, res) => {
    try {
        const { customerName, phone, shippingAddress, items, paymentMethod, note, voucherCode } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Don hang phai chua it nhat mot san pham');
        }

        const orderCode = generateOrderCode();
        
        // Tinh lai server-side de tranh tamper tu client
        let subtotal = 0;
        const enrichedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                throw new Error(`San pham voi ID ${item.productId} khong ton tai`);
            }
            
            if (product.stock < item.quantity) {
                throw new Error(`San pham "${product.name}" khong du ton kho`);
            }

            const itemSubtotal = product.price * item.quantity;
            subtotal += itemSubtotal;

            enrichedItems.push({
                productId: product._id,
                name: product.name,
                image: product.images?.[0]?.url || '',
                price: product.price, // Su dung gia goc tu database
                quantity: item.quantity,
                subtotal: itemSubtotal
            });
        }

        const shippingFee = 30000;
        let discountAmount = 0;
        let validVoucherCode = null;

        if (voucherCode) {
            const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });
            if (!voucher) throw new Error('Ma giam gia khong ton tai');
            if (!voucher.isActive) throw new Error('Ma giam gia da bi khoa hoac ngung ap dung');
            if (new Date() > new Date(voucher.expiryDate)) throw new Error('Ma giam gia da het han');
            if (subtotal < voucher.minOrderValue) throw new Error(`Don hang chua dat gia tri toi thieu (${voucher.minOrderValue.toLocaleString()}d) de dung ma nay`);
            
            // Va loi Race Condition bang Atomic Update
            const updatedVoucher = await Voucher.findOneAndUpdate(
                { 
                    _id: voucher._id, 
                    usedCount: { $lt: voucher.usageLimit } 
                },
                { $inc: { usedCount: 1 } },
                { new: true }
            );

            if (!updatedVoucher) {
                throw new Error('Ma giam gia da het luot su dung');
            }

            if (voucher.discountType === 'FIXED') {
                discountAmount = voucher.discountValue;
            } else {
                discountAmount = (subtotal * voucher.discountValue) / 100;
                if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
                    discountAmount = voucher.maxDiscount;
                }
            }
            // Giam khong qua subtotal
            discountAmount = Math.min(discountAmount, subtotal);
            validVoucherCode = voucher.code;
        }

        const finalTotal = subtotal + shippingFee - discountAmount;

        let userId = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (err) {
                // Token loi/het han thi coi nhu Guest
            }
        }

        const order = new Order({
            orderCode,
            userId,
            customerName,
            phone,
            shippingAddress,
            note,
            items: enrichedItems, // Su dung enrichedItems da xac thuc
            subtotal,
            shippingFee,
            voucherCode: validVoucherCode,
            discountAmount,
            totalAmount: finalTotal,
            paymentMethod: paymentMethod || 'COD',
            timeline: [{ status: 'PENDING', note: 'Khach hang dat hang thanh cong' }]
        });

        await order.save();

        // Gửi thông báo Telegram cho Admin
        const msg = `<b>🔔 CÓ ĐƠN HÀNG MỚI!</b>\n\n` +
                    `📦 Mã đơn: <code>${orderCode}</code>\n` +
                    `👤 Khách hàng: ${customerName}\n` +
                    `📞 SĐT: ${phone}\n` +
                    `💰 Tổng tiền: <b>${finalTotal.toLocaleString()} VNĐ</b>\n` +
                    `💳 Thanh toán: ${paymentMethod === 'QR' ? 'Chuyển khoản QR' : 'COD'}\n` +
                    `📍 Địa chỉ: ${shippingAddress}`;
        sendTelegramMessage(msg);

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 2. Xác nhận đơn hàng (PENDING → CONFIRMED) & Trừ kho (Admin only)
exports.confirmOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const order = await Order.findById(req.params.id).session(session);
        if (!order) throw new Error('Không tìm thấy đơn hàng');
        if (order.orderStatus !== 'PENDING') throw new Error('Chỉ có thể xác nhận đơn hàng ở trạng thái PENDING');

        // Check & Deduct Inventory (Atomic Transaction - Tránh Overselling)
        for (const item of order.items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product || product.stock < item.quantity) {
                throw new Error(`Sản phẩm "${item.name}" không đủ tồn kho (Còn lại: ${product?.stock || 0})`);
            }
            product.stock -= item.quantity;
            product.sold += item.quantity;
            await product.save({ session });
        }

        order.orderStatus = 'CONFIRMED';
        order.timeline.push({ 
            status: 'CONFIRMED', 
            note: `Đơn hàng được xác nhận bởi Admin ${req.user.name}` 
        });
        await order.save({ session });

        // Ghi nhật ký hệ thống (Audit Log)
        await new AuditLog({
            userId: req.user.id || req.user._id,
            adminName: req.user.name,
            action: 'CONFIRM_ORDER',
            targetModel: 'Order',
            targetId: order._id.toString(),
            details: `Xác nhận đơn hàng ${order.orderCode}. Tổng tiền: ${order.totalAmount.toLocaleString()} VNĐ`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        }).save({ session });

        await session.commitTransaction();
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// 3. Bắt đầu giao hàng (CONFIRMED → SHIPPING) (Admin only)
exports.shipOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        if (order.orderStatus !== 'CONFIRMED') throw new Error('Đơn hàng phải được xác nhận trước khi giao');

        order.orderStatus = 'SHIPPING';
        order.timeline.push({ 
            status: 'SHIPPING', 
            note: `Đơn hàng được bàn giao vận chuyển bởi Admin ${req.user.name}` 
        });
        await order.save();

        // Ghi nhật ký hệ thống (Audit Log)
        await AuditLog.create({
            userId: req.user.id || req.user._id,
            adminName: req.user.name,
            action: 'SHIP_ORDER',
            targetModel: 'Order',
            targetId: order._id.toString(),
            details: `Bàn giao vận chuyển đơn hàng ${order.orderCode}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 4. Đã giao hàng (SHIPPING → DELIVERED) (Admin only)
exports.deliverOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        if (order.orderStatus !== 'SHIPPING') throw new Error('Chỉ có thể hoàn tất đơn hàng đang giao');

        order.orderStatus = 'DELIVERED';
        if (order.paymentMethod === 'COD') order.paymentStatus = 'PAID';
        
        order.timeline.push({ 
            status: 'DELIVERED', 
            note: `Đơn hàng được hoàn tất giao bởi Admin ${req.user.name}` 
        });
        await order.save();

        // Ghi nhật ký hệ thống (Audit Log)
        await AuditLog.create({
            userId: req.user.id || req.user._id,
            adminName: req.user.name,
            action: 'DELIVER_ORDER',
            targetModel: 'Order',
            targetId: order._id.toString(),
            details: `Hoàn tất giao nhận đơn hàng ${order.orderCode}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 5. Admin hủy đơn hàng (PENDING/CONFIRMED → CANCELLED)
exports.cancelOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const order = await Order.findById(req.params.id).session(session);
        if (!order) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }
        if (['SHIPPING', 'DELIVERED', 'CANCELLED'].includes(order.orderStatus)) {
            throw new Error('Không thể hủy đơn hàng ở trạng thái này');
        }

        // Hoàn kho nếu đơn đã CONFIRMED (kho đã bị trừ)
        if (order.orderStatus === 'CONFIRMED') {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.productId, { 
                    $inc: { stock: item.quantity, sold: -item.quantity } 
                }, { session });
            }
        }

        order.orderStatus = 'CANCELLED';
        order.paymentStatus = 'FAILED';
        order.cancelReason = req.body.reason || 'Không có lý do';
        order.timeline.push({ 
            status: 'CANCELLED', 
            note: `Đơn hàng bị hủy bởi Admin ${req.user.name}. Lý do: ${req.body.reason || 'Không có lý do'}` 
        });
        await order.save({ session });

        // Ghi nhật ký hệ thống (Audit Log)
        await new AuditLog({
            userId: req.user.id || req.user._id,
            adminName: req.user.name,
            action: 'CANCEL_ORDER',
            targetModel: 'Order',
            targetId: order._id.toString(),
            details: `Hủy đơn hàng ${order.orderCode}. Lý do: ${req.body.reason || 'Không có lý do'}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        }).save({ session });

        await session.commitTransaction();
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};

// ============================================================
// 6. CUSTOMER HỦY ĐƠN HÀNG — Service Method: cancelOrderByCustomer
// ============================================================
// Security Layers:
//   Layer 1 — JWT Authentication  (middleware protect)
//   Layer 2 — Ownership Validation (order.userId === req.user.id)
//   Layer 3 — Status Validation    (chỉ PENDING mới được hủy)
//   Layer 4 — Inventory Strategy   (PENDING chưa trừ kho → không cần rollback)
// ============================================================
exports.cancelOrderByCustomer = async (req, res) => {
    try {
        const orderId = req.params.id;
        const customerId = req.user.id;

        // --- VALIDATION LAYER 1: Order tồn tại ---
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                code: 'ORDER_NOT_FOUND',
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // --- VALIDATION LAYER 2: Ownership (Backend is source of truth) ---
        // Prevent User A từ hủy đơn của User B.
        // Hỗ trợ cả 2 trường hợp: Đơn có userId, hoặc đơn Guest cũ có cùng số điện thoại
        const isOwnerByUserId = order.userId && order.userId.toString() === customerId.toString();
        const isOwnerByPhone = !order.userId && order.phone === req.user.phone;

        if (!isOwnerByUserId && !isOwnerByPhone) {
            return res.status(403).json({
                success: false,
                code: 'FORBIDDEN_NOT_YOUR_ORDER',
                message: 'Bạn không có quyền thao tác với đơn hàng này'
            });
        }

        // --- VALIDATION LAYER 3: Status (chỉ PENDING mới được customer hủy) ---
        if (order.orderStatus !== 'PENDING') {
            const statusMessages = {
                'CONFIRMED': 'Đơn hàng đã được xác nhận và đang được xử lý. Vui lòng liên hệ hỗ trợ để được giúp đỡ.',
                'SHIPPING':  'Đơn hàng đang trên đường giao. Không thể hủy lúc này.',
                'DELIVERED': 'Đơn hàng đã được giao thành công. Không thể hủy.',
                'CANCELLED': 'Đơn hàng này đã bị hủy trước đó.'
            };
            return res.status(400).json({
                success: false,
                code: 'INVALID_STATUS_FOR_CANCEL',
                message: statusMessages[order.orderStatus] || 'Không thể hủy đơn hàng ở trạng thái này'
            });
        }

        // --- INVENTORY STRATEGY ---
        // PENDING → Customer cancel: KHÔNG cần rollback inventory
        // Lý do: Kho chỉ bị trừ khi Admin bấm CONFIRM (xem confirmOrder)
        // Tại PENDING, không có gì bị deduct → cancel an toàn, không cần transaction

        const reason = req.body.reason?.trim() || 'Khách hàng tự hủy';

        order.orderStatus = 'CANCELLED';
        order.paymentStatus = 'FAILED';
        order.timeline.push({
            status: 'CANCELLED',
            note: `Khách hàng hủy đơn. Lý do: ${reason}`
        });

        await order.save();

        res.status(200).json({
            success: true,
            data: order,
            message: 'Đơn hàng đã được hủy thành công'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Lấy tất cả đơn hàng (Admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort('-createdAt');
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 8. Lấy đơn hàng của tôi (User — query bằng userId, an toàn hơn phone)
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        // Query chính: tìm theo userId (đăng nhập → đặt hàng)
        let orders = await Order.find({ userId }).sort('-createdAt').populate('items.productId');

        // Fallback: nếu user cập nhật phone và có đơn cũ chưa có userId
        // thì cũng lấy thêm đơn theo phone để không mất lịch sử
        if (req.user.phone) {
            const phoneOrders = await Order.find({ 
                phone: req.user.phone, 
                userId: null  // chỉ lấy đơn chưa gắn userId
            }).sort('-createdAt').populate('items.productId');
            
            // Merge và loại trùng
            const allOrders = [...orders, ...phoneOrders];
            const uniqueOrders = allOrders.filter((o, i, self) => 
                i === self.findIndex(t => t._id.toString() === o._id.toString())
            );
            uniqueOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            return res.status(200).json({ success: true, data: uniqueOrders });
        }

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 9. Khách hàng thông báo đã chuyển khoản (QR Payment)
exports.notifyPayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        // --- VALIDATION LAYER: Quyền sở hữu (Ownership validation) ---
        const customerId = req.user.id;
        const isOwnerByUserId = order.userId && order.userId.toString() === customerId.toString();
        const isOwnerByPhone = !order.userId && order.phone === req.user.phone;

        if (!isOwnerByUserId && !isOwnerByPhone) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thao tác với đơn hàng này'
            });
        }

        // Chỉ cho phép thông báo nếu đang PENDING và dùng QR
        if (order.paymentMethod !== 'QR') {
            throw new Error('Chỉ đơn hàng thanh toán QR mới cần thông báo chuyển khoản');
        }

        // Kiểm tra xem đã thông báo chưa để tránh spam
        const alreadyNotified = order.timeline.some(t => t.status === 'PAYMENT_NOTIFIED');
        if (alreadyNotified) {
            return res.status(200).json({ success: true, message: 'Thông báo đã được ghi nhận trước đó' });
        }

        order.timeline.push({
            status: 'PAYMENT_NOTIFIED',
            note: 'Người mua thông báo đã chuyển khoản qua QR. Đang chờ Admin xác nhận tiền về.'
        });

        await order.save();

        // Gửi thông báo Telegram cho Admin
        const msg = `<b>💰 KHÁCH BÁO ĐÃ CHUYỂN KHOẢN!</b>\n\n` +
                    `📦 Đơn hàng: <code>${order.orderCode}</code>\n` +
                    `👤 Khách hàng: ${order.customerName}\n` +
                    `💵 Số tiền: <b>${order.totalAmount.toLocaleString()} VNĐ</b>\n\n` +
                    `<i>Vui lòng kiểm tra tài khoản ngân hàng để xác nhận!</i>`;
        sendTelegramMessage(msg);

        res.status(200).json({ success: true, message: 'Đã gửi thông báo chuyển khoản thành công' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 10. Admin xác nhận đã nhận tiền (Dành cho QR/Bank Transfer)
exports.confirmPaymentAdmin = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        order.paymentStatus = 'PAID';
        order.timeline.push({
            status: 'PAID',
            note: `Thanh toán được xác nhận bởi Admin ${req.user.name}`
        });

        await order.save();

        // Ghi nhật ký hệ thống (Audit Log)
        await AuditLog.create({
            userId: req.user.id || req.user._id,
            adminName: req.user.name,
            action: 'CONFIRM_PAYMENT',
            targetModel: 'Order',
            targetId: order._id.toString(),
            details: `Xác nhận đã nhận tiền thanh toán cho đơn hàng ${order.orderCode}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ============================================================
// ADMIN DASHBOARD STATS ENDPOINT
// ============================================================
exports.adminGetStats = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const yearStart = new Date();
        yearStart.setMonth(0, 1);
        yearStart.setHours(0, 0, 0, 0);

        // 1. KPI - Today's Revenue (DELIVERED)
        const todayRevenueResult = await Order.aggregate([
            { $match: { orderStatus: 'DELIVERED', createdAt: { $gte: todayStart } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const todayRevenue = todayRevenueResult[0]?.total || 0;

        // 2. KPI - This Month's Revenue (DELIVERED)
        const monthRevenueResult = await Order.aggregate([
            { $match: { orderStatus: 'DELIVERED', createdAt: { $gte: monthStart } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const monthRevenue = monthRevenueResult[0]?.total || 0;

        // 3. KPI - Total Active Customers (role: customer)
        const totalCustomers = await User.countDocuments({ role: 'customer' });

        // 4. KPI - Total Products Count
        const totalProducts = await Product.countDocuments();

        // 5. Recent Orders (5 newest)
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // 6. Top Selling Products (Top 5 by actual sold numbers)
        const topProducts = await Product.find()
            .sort({ sold: -1 })
            .limit(5)
            .select('name price stock sold images');

        // 7. Order Status Distribution (Pie Chart data)
        const statusDistributionResult = await Order.aggregate([
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);
        const statusDistribution = {
            PENDING: 0,
            CONFIRMED: 0,
            SHIPPING: 0,
            DELIVERED: 0,
            CANCELLED: 0
        };
        statusDistributionResult.forEach(item => {
            if (statusDistribution[item._id] !== undefined) {
                statusDistribution[item._id] = item.count;
            }
        });

        // 8. Daily Revenue Chart - Last 30 Days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const dailyRevenueResult = await Order.aggregate([
            { 
                $match: { 
                    orderStatus: 'DELIVERED', 
                    createdAt: { $gte: thirtyDaysAgo } 
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 9. Monthly Revenue Chart - This Year
        const monthlyRevenueResult = await Order.aggregate([
            { 
                $match: { 
                    orderStatus: 'DELIVERED', 
                    createdAt: { $gte: yearStart } 
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                kpi: {
                    todayRevenue,
                    monthRevenue,
                    totalCustomers,
                    totalProducts
                },
                recentOrders,
                topProducts,
                statusDistribution,
                dailyRevenue: dailyRevenueResult,
                monthlyRevenue: monthlyRevenueResult
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 11. Lấy thông tin tài khoản ngân hàng công khai (VietQR) phục vụ Frontend checkout
exports.getPaymentConfig = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                bankName: process.env.BANK_NAME || 'MB',
                bankAccountNo: process.env.BANK_ACCOUNT_NO || '0000803885585',
                bankAccountName: process.env.BANK_ACCOUNT_NAME || 'NGUYEN THI DUYEN',
                bankId: process.env.BANK_ID || '970422'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
