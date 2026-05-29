const SupportRequest = require('../models/SupportRequest');
const { sendTelegramMessage } = require('../utils/telegram');

// Category → Subject mapping
const categorySubjects = {
    'order': 'Vấn đề về đơn hàng',
    'product': 'Tư vấn sản phẩm',
    'warranty': 'Bảo hành & Đổi trả',
    'other': 'Yêu cầu khác'
};

// 1. Khách hàng gửi yêu cầu hỗ trợ
exports.createSupportRequest = async (req, res) => {
    try {
        const { category, detail } = req.body;
        const user = req.user;

        if (!detail || detail.trim().length < 10) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng mô tả chi tiết vấn đề (tối thiểu 10 ký tự)' 
            });
        }

        const supportRequest = new SupportRequest({
            userId: user.id,
            customerName: user.name,
            customerEmail: user.email,
            customerPhone: user.phone || '',
            category: category || 'other',
            subject: categorySubjects[category] || categorySubjects['other'],
            detail: detail.trim()
        });

        await supportRequest.save();

        // Gửi thông báo Telegram cho Admin
        const msg = `<b>📩 YÊU CẦU HỖ TRỢ MỚI!</b>\n\n` +
                    `👤 Khách hàng: ${user.name}\n` +
                    `📧 Email: ${user.email}\n` +
                    `📞 SĐT: ${user.phone || 'Chưa cung cấp'}\n` +
                    `📋 Loại: <b>${categorySubjects[category] || 'Khác'}</b>\n` +
                    `💬 Chi tiết: ${detail.substring(0, 200)}${detail.length > 200 ? '...' : ''}\n\n` +
                    `<i>Vui lòng vào trang quản trị để xử lý!</i>`;
        sendTelegramMessage(msg);

        res.status(201).json({ 
            success: true, 
            data: supportRequest,
            message: 'Yêu cầu hỗ trợ đã được gửi thành công!' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Admin lấy tất cả yêu cầu hỗ trợ
exports.getAllSupportRequests = async (req, res) => {
    try {
        const requests = await SupportRequest.find()
            .sort('-createdAt')
            .populate('userId', 'name email phone')
            .populate('resolvedBy', 'name');
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Admin cập nhật trạng thái yêu cầu hỗ trợ
exports.updateSupportRequest = async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        
        const updateData = {};
        if (status) updateData.status = status;
        if (adminNote !== undefined) updateData.adminNote = adminNote;
        
        // Nếu chuyển sang RESOLVED, ghi nhận thời gian và người xử lý
        if (status === 'RESOLVED' || status === 'CLOSED') {
            updateData.resolvedAt = new Date();
            updateData.resolvedBy = req.user.id;
        }

        const request = await SupportRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu hỗ trợ' });
        }

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 4. Admin xóa yêu cầu hỗ trợ
exports.deleteSupportRequest = async (req, res) => {
    try {
        const request = await SupportRequest.findByIdAndDelete(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu hỗ trợ' });
        }
        res.status(200).json({ success: true, message: 'Đã xóa yêu cầu hỗ trợ' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
