const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    createSupportRequest,
    getAllSupportRequests,
    updateSupportRequest,
    deleteSupportRequest
} = require('../controllers/supportController');
const { protect, authorize } = require('../middlewares/auth');

// Cấu hình Rate Limiter cho luồng gửi hỗ trợ khách hàng
const isDev = process.env.NODE_ENV === 'development';
const supportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: isDev ? 100 : 5, // Tối đa 5 yêu cầu / 15 phút khi production, 100 khi dev
    message: { 
        success: false, 
        message: 'Bạn đang gửi yêu cầu hỗ trợ quá nhanh. Vui lòng thử lại sau 15 phút.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: (req) => {
        // Giới hạn theo User ID nếu đã được giải mã từ protect middleware, fallback về IP
        return req.user ? req.user.id : req.ip;
    }
});

// ============================================================
// CUSTOMER ROUTES — JWT Required
// ============================================================
// POST /api/support — Gửi yêu cầu hỗ trợ
router.post('/', protect, supportLimiter, createSupportRequest);

// ============================================================
// ADMIN ROUTES — JWT + Admin role required
// ============================================================
router.get('/', protect, authorize('admin'), getAllSupportRequests);
router.put('/:id', protect, authorize('admin'), updateSupportRequest);
router.delete('/:id', protect, authorize('admin'), deleteSupportRequest);

module.exports = router;
