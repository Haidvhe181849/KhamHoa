const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { 
    register, 
    login, 
    logout, 
    getMe, 
    updateProfile, 
    changePassword,
    refreshToken, 
    forgotPassword, 
    resetPassword,
    adminGetUsers,
    adminGetAuditLogs,
    adminUpdateUserRole,
    adminBlockUser,
    adminUnblockUser,
    getSocketToken,
    updateAvatar
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

// Cấu hình Rate Limiter cho các API nhạy cảm (Đăng nhập, đăng ký, quên mật khẩu)
// Tối đa 100 yêu cầu / 15 phút khi dev, 20 yêu cầu / 15 phút khi production
const isDev = process.env.NODE_ENV === 'development';
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: isDev ? 100 : 20, // 100 requests (Dev) hoặc 20 requests (Prod)
    message: { 
        success: false, 
        message: 'Thao tác quá thường xuyên. Vui lòng thử lại sau 15 phút.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Định nghĩa các Router Auth & User
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgotpassword', authLimiter, forgotPassword);
router.post('/resetpassword', authLimiter, resetPassword);

// Router thông tin cá nhân (Được bảo vệ bằng middleware protect)
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/me/avatar', protect, upload.single('avatar'), updateAvatar);
router.put('/me/password', protect, changePassword);

// Router lấy token phục vụ kết nối Live Chat Socket.IO
router.get('/socket-token', protect, getSocketToken);

// Router quản lý người dùng của Admin
router.get('/admin/list', protect, authorize('admin'), adminGetUsers);
router.get('/admin/audit-logs', protect, authorize('admin'), adminGetAuditLogs);
router.put('/admin/:id/role', protect, authorize('admin'), adminUpdateUserRole);
router.put('/admin/:id/block', protect, authorize('admin'), adminBlockUser);
router.put('/admin/:id/unblock', protect, authorize('admin'), adminUnblockUser);

module.exports = router;
