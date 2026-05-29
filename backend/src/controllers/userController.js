const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const AuditLog = require('../models/AuditLog');

// Hàm cấu hình Cookie động theo môi trường (giải quyết triệt để lỗi chặn cookie trên cross-domain/Vercel/Render)
const getCookieOptions = (req, maxAgeMs = null) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const options = {
        httpOnly: true,
        // Bắt buộc phải là secure=true nếu sameSite='none' hoặc trên production
        secure: process.env.COOKIE_SECURE === 'true' || isProduction,
        sameSite: process.env.COOKIE_SAME_SITE || 'lax'
    };

    if (process.env.COOKIE_DOMAIN) {
        options.domain = process.env.COOKIE_DOMAIN;
    }
    
    if (maxAgeMs) {
        options.maxAge = maxAgeMs;
    }

    return options;
};

// Tạo Token và lưu vào Cookie HttpOnly (Gồm Access Token và Refresh Token)
const sendCookiesAndToken = (user, statusCode, req, res, rememberMe = false) => {
    // 1. Tạo Access Token (Ngắn hạn - 15 phút) - Đóng gói role để Frontend Edge Middleware đọc trực tiếp
    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '15m'
    });

    // 2. Tạo Refresh Token (Dài hạn - 30 ngày)
    const refreshToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    // 3. Thiết lập tùy chọn Cookie
    // Access Cookie: Hết hạn sau 15 phút
    const accessCookieOptions = getCookieOptions(req, 15 * 60 * 1000);
    
    // Refresh Cookie: Nếu rememberMe là true thì lưu 30 ngày, ngược lại là session cookie
    const refreshCookieOptions = rememberMe 
        ? getCookieOptions(req, 30 * 24 * 60 * 60 * 1000)
        : getCookieOptions(req); // không có maxAge = session cookie

    // 4. Lưu Token vào Cookies
    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.status(statusCode).json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            address: user.address
        }
    });
};

// Đăng ký người dùng
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Kiểm tra định dạng Email thủ công ngoài validate mongoose
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin đăng ký' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại trong hệ thống' });
        }

        const user = await User.create({
            name,
            email,
            password
        });

        // Đăng ký xong tự động đăng nhập (sử dụng session cookie làm mặc định)
        sendCookiesAndToken(user, 201, req, res, false);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
        }

        sendCookiesAndToken(user, 200, req, res, rememberMe === true);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đăng xuất (Xóa cookies)
exports.logout = async (req, res) => {
    try {
        const cookieOptions = getCookieOptions(req);
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);

        res.status(200).json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy thông tin cá nhân
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

  // Cập nhật thông tin cá nhân
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        
        if (phone) {
            const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09).' });
            }
        }
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, address },
            { returnDocument: 'after', runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: user,
            message: 'Cập nhật hồ sơ thành công'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Cập nhật Avatar
exports.updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn một ảnh để tải lên' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatar: req.file.path },
            { returnDocument: 'after', runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: user,
            message: 'Cập nhật ảnh đại diện thành công'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Refresh Access Token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Phiên làm việc đã hết hạn' });
        }

        // Xác minh refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Người dùng không còn tồn tại' });
        }

        // Tạo Access Token mới
        const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '15m'
        });

        // Ghi đè Access Cookie mới
        const accessCookieOptions = getCookieOptions(req, 15 * 60 * 1000);
        res.cookie('accessToken', accessToken, accessCookieOptions);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng với email này' });
        }

        // Tạo mã OTP 6 chữ số ngẫu nhiên
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Lưu mã vào cơ sở dữ liệu và thiết lập hết hạn trong 10 phút
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Thực hiện gửi Email chứa mã OTP thực tế
        try {
            await sendEmail({
                email: user.email,
                subject: 'Khôi phục mật khẩu tài khoản - Khảm Hoa Store',
                otpCode: resetToken
            });
        } catch (err) {
            // Nếu gửi mail lỗi, dọn dẹp DB và báo lỗi
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            
            console.error("Nodemailer dispatch error:", err);
            return res.status(500).json({ success: false, message: 'Không thể gửi email khôi phục. Vui lòng kiểm tra lại cấu hình SMTP.' });
        }

        // Phản hồi thành công
        res.status(200).json({
            success: true,
            message: 'Mã khôi phục mật khẩu đã được gửi đến email của bạn thành công!'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đặt lại mật khẩu mới
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ mã khôi phục và mật khẩu mới' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải chứa ít nhất 6 ký tự' });
        }

        // Tìm kiếm người dùng có token hợp lệ và chưa hết hạn
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Mã khôi phục không chính xác hoặc đã hết hạn' });
        }

        // Đặt mật khẩu mới (hook userSchema.pre('save') sẽ tự động mã hóa mật khẩu)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Đổi mật khẩu cho người dùng đang đăng nhập
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền mật khẩu hiện tại và mật khẩu mới' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự' });
        }

        const user = await User.findById(req.user.id).select('+password');

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
        }

        // Đổi mật khẩu mới (hook save của User.js sẽ tự động mã hóa mật khẩu)
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Đổi mật khẩu thành công!'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ============================================================

// 1. Lấy danh sách người dùng (Admin)
exports.adminGetUsers = async (req, res) => {
    try {
        const { search = '', role, page = 1, limit = 10 } = req.query;

        const query = {};
        
        if (search) {
            // Vá lỗi ReDoS bằng cách xóa các ký tự đặc biệt của biểu thức chính quy (Regex) trước khi đưa vào truy vấn
            const safeSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { phone: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role;
        }

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;

        const total = await User.countDocuments(query);
        const totalPages = Math.ceil(total / limitNum);

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            total,
            totalPages,
            currentPage: pageNum,
            data: users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 1.5 Lấy danh sách Nhật ký Hệ thống (Admin Audit Logs)
exports.adminGetAuditLogs = async (req, res) => {
    try {
        const { search = '', action, targetModel, startDate, endDate, page = 1, limit = 20 } = req.query;

        const query = {};
        
        if (search) {
            const safeSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            query.$or = [
                { adminName: { $regex: safeSearch, $options: 'i' } },
                { details: { $regex: safeSearch, $options: 'i' } },
                { action: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        if (action) {
            query.action = action;
        }

        if (targetModel) {
            query.targetModel = targetModel;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;

        const total = await AuditLog.countDocuments(query);
        const totalPages = Math.ceil(total / limitNum);

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            total,
            totalPages,
            currentPage: pageNum,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Cập nhật vai trò người dùng (Admin)
exports.adminUpdateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role || !['customer', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // Không cho phép tự hạ quyền của chính mình
        if (req.user.id === req.params.id && role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Bạn không thể tự hạ quyền quản trị viên của chính mình' });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        // Ghi nhật ký hệ thống (Audit Log)
        await AuditLog.create({
            userId: req.user.id || req.user._id,
            adminName: req.user.name,
            action: 'UPDATE_USER_ROLE',
            targetModel: 'User',
            targetId: user._id.toString(),
            details: `Cập nhật vai trò người dùng ${user.email} từ ${oldRole} thành ${role}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });

        res.status(200).json({
            success: true,
            message: 'Cập nhật vai trò thành công',
            data: user
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 3. Khóa tài khoản người dùng (Admin)
exports.adminBlockUser = async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ success: false, message: 'Bạn không thể tự khóa tài khoản của chính mình' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        user.isBlocked = true;
        await user.save();

        // Ghi nhật ký hệ thống (Audit Log)
        await AuditLog.create({
            userId: req.user.id || req.user._id,
            adminName: req.user.name,
            action: 'BLOCK_USER',
            targetModel: 'User',
            targetId: user._id.toString(),
            details: `Khóa tài khoản người dùng ${user.email}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });

        res.status(200).json({
            success: true,
            message: `Đã khóa tài khoản của người dùng ${user.name} thành công.`,
            data: user
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 4. Mở khóa tài khoản người dùng (Admin)
exports.adminUnblockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        user.isBlocked = false;
        await user.save();

        // Ghi nhật ký hệ thống (Audit Log)
        await AuditLog.create({
            userId: req.user.id || req.user._id,
            adminName: req.user.name,
            action: 'UNBLOCK_USER',
            targetModel: 'User',
            targetId: user._id.toString(),
            details: `Mở khóa tài khoản người dùng ${user.email}`,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });

        res.status(200).json({
            success: true,
            message: `Đã mở khóa tài khoản của người dùng ${user.name} thành công.`,
            data: user
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 5. Lấy Token phục vụ kết nối Live Chat Socket.IO (Xác thực thông qua Cookie HttpOnly)
exports.getSocketToken = async (req, res) => {
    try {
        const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Không tìm thấy token truy cập' });
        }
        res.status(200).json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

