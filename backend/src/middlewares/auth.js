const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware xác thực JWT
exports.protect = async (req, res, next) => {
    try {
        let token;
        
        // Kiểm tra token từ cookie hoặc header Authorization
        if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để truy cập' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Người dùng không còn tồn tại' });
        }

        if (req.user.isBlocked) {
            return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa bởi Admin' });
        }

        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
};

// Middleware kiểm tra quyền Admin
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Quyền ${req.user.role} không được phép thực hiện hành động này` 
            });
        }
        next();
    };
};
