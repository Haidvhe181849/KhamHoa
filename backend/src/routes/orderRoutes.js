const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { 
    createOrder, 
    getAllOrders, 
    getMyOrders,
    confirmOrder,
    shipOrder,
    deliverOrder,
    cancelOrder,
    cancelOrderByCustomer,
    notifyPayment,
    confirmPaymentAdmin,
    adminGetStats,
    getPaymentConfig
} = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/auth');

// Cấu hình Rate Limiter cho luồng đặt hàng để chống spam đơn ảo
const isDev = process.env.NODE_ENV === 'development';
const orderLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 phút
    max: isDev ? 100 : 5, // Tối đa 5 đơn hàng / 5 phút khi production, 100 khi dev
    message: { 
        success: false, 
        message: 'Bạn đang đặt hàng quá nhanh. Vui lòng thử lại sau 5 phút.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: (req) => {
        // Trích xuất userId từ JWT (Cookie hoặc Header Authorization) để chặn spam qua nhiều IP proxy/VPN
        let token;
        if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                return decoded.id; // Giới hạn theo User ID nếu đã đăng nhập
            } catch (err) {
                // Token không hợp lệ -> fallback về IP
            }
        }
        return req.ip; // Khách vãng lai giới hạn theo IP
    }
});

// ============================================================
// PUBLIC ROUTES
// ============================================================
// POST /api/orders — Tạo đơn hàng (guest hoặc logged-in)
// Nếu user đang đăng nhập (có JWT), controller sẽ tự gắn userId
router.post('/', orderLimiter, createOrder);

// GET /api/orders/payment-config — Lấy cấu hình ngân hàng (VietQR) cho Frontend
router.get('/payment-config', getPaymentConfig);

// ============================================================
// CUSTOMER ROUTES — JWT Required, không cần admin role
// ============================================================

// GET /api/orders/my — Xem lịch sử đơn của tôi
router.get('/my', protect, getMyOrders);

// PATCH /api/orders/:id/cancel — Customer tự hủy đơn (chỉ PENDING)
router.patch('/:id/cancel', protect, cancelOrderByCustomer);

// POST /api/orders/:id/notify-payment — Khách hàng báo đã chuyển khoản (QR)
router.post('/:id/notify-payment', protect, notifyPayment);

// ============================================================
// ADMIN ROUTES — JWT + Admin role required
// ============================================================
router.get('/admin/stats', protect, authorize('admin'), adminGetStats);
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id/confirm', protect, authorize('admin'), confirmOrder);
router.put('/:id/ship', protect, authorize('admin'), shipOrder);
router.put('/:id/deliver', protect, authorize('admin'), deliverOrder);
router.put('/:id/cancel', protect, authorize('admin'), cancelOrder);
router.put('/:id/confirm-payment', protect, authorize('admin'), confirmPaymentAdmin);

module.exports = router;
