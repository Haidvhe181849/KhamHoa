const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

// API: Kiểm tra điều kiện viết đánh giá
exports.checkEligibility = async (req, res) => {
    try {
        const { productId } = req.params;
        const user = req.user;

        // Tìm đơn hàng của user này có chứa productId, trạng thái DELIVERED, và chưa đánh giá
        const order = await Order.findOne({
            $or: [
                { userId: user.id },
                { userId: null, phone: user.phone }
            ],
            orderStatus: 'DELIVERED',
            'items': {
                $elemMatch: {
                    productId: productId,
                    isReviewed: false
                }
            }
        });

        if (order) {
            return res.status(200).json({ success: true, eligible: true, orderId: order._id });
        }

        return res.status(200).json({ success: true, eligible: false });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Tạo mới đánh giá
exports.createReview = async (req, res) => {
    try {
        const { productId, orderId, rating, comment } = req.body;
        const user = req.user;

        // Kiểm tra lại điều kiện hợp lệ
        const order = await Order.findOne({
            _id: orderId,
            $or: [
                { userId: user.id },
                { userId: null, phone: user.phone }
            ],
            orderStatus: 'DELIVERED',
            'items': {
                $elemMatch: {
                    productId: productId,
                    isReviewed: false
                }
            }
        });

        if (!order) {
            return res.status(403).json({ success: false, message: 'Bạn không đủ điều kiện đánh giá sản phẩm này hoặc đã đánh giá rồi.' });
        }

        // Xử lý ảnh (nếu có)
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => ({
                publicId: file.filename,
                url: file.path
            }));
        }

        // Tạo review
        const review = await Review.create({
            userId: user.id,
            productId,
            orderId,
            rating: Number(rating),
            comment,
            images
        });

        // Cập nhật isReviewed trong Order
        await Order.updateOne(
            { _id: orderId, "items.productId": productId },
            { $set: { "items.$.isReviewed": true } }
        );

        // Tính lại điểm trung bình cho Product
        const allReviews = await Review.find({ productId });
        const reviewsCount = allReviews.length;
        const averageRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount;

        await Product.findByIdAndUpdate(productId, {
            rating: averageRating.toFixed(1),
            reviewsCount
        });

        res.status(201).json({ success: true, data: review, message: 'Đánh giá thành công' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// API: Lấy danh sách đánh giá của sản phẩm
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 5 } = req.query;

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(20, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;

        const total = await Review.countDocuments({ productId, isHidden: { $ne: true } });
        const totalPages = Math.ceil(total / limitNum);

        const reviews = await Review.find({ productId, isHidden: { $ne: true } })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 }) // Mới nhất lên đầu
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            total,
            totalPages,
            currentPage: pageNum,
            data: reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Lấy đánh giá cho trang chủ (Public, 5 sao, dài, mới nhất)
exports.getPublicReviews = async (req, res) => {
    try {
        const { limit = 6 } = req.query;
        const limitNum = Math.min(20, Math.max(1, Number(limit)));

        const reviews = await Review.find({ isHidden: { $ne: true }, rating: 5 })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        reviews.sort((a, b) => {
            const lenDiff = (b.comment?.length || 0) - (a.comment?.length || 0);
            if (lenDiff !== 0) return lenDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.status(200).json({
            success: true,
            data: reviews.slice(0, limitNum)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// ADMIN APIs
// ==========================================

// API: Lấy tất cả đánh giá cho Admin
exports.getAdminReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10, stars, isReplied, isHidden } = req.query;

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;

        let query = {};
        if (stars) query.rating = Number(stars);
        if (isReplied !== undefined) query.isReplied = isReplied === 'true';
        if (isHidden !== undefined) query.isHidden = isHidden === 'true';

        const total = await Review.countDocuments(query);
        const totalPages = Math.ceil(total / limitNum);

        const reviews = await Review.find(query)
            .populate('userId', 'name avatar')
            .populate('productId', 'name images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Calculate Overview Stats
        const totalReviews = await Review.countDocuments();
        const repliedReviews = await Review.countDocuments({ isReplied: true });
        
        // aggregate for average rating
        const ratingAgg = await Review.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);
        const avgRating = ratingAgg.length > 0 ? ratingAgg[0].avgRating.toFixed(1) : 0;

        res.status(200).json({
            success: true,
            total,
            totalPages,
            currentPage: pageNum,
            data: reviews,
            stats: {
                totalReviews,
                repliedReviews,
                avgRating
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Admin trả lời đánh giá
exports.replyReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyComment } = req.body;

        if (!replyComment) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung trả lời.' });
        }

        const review = await Review.findByIdAndUpdate(
            id,
            { 
                replyComment, 
                isReplied: true 
            },
            { new: true, runValidators: true }
        ).populate('userId', 'name avatar').populate('productId', 'name images');

        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
        }

        res.status(200).json({ success: true, data: review, message: 'Đã trả lời đánh giá.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Admin Ẩn/Hiện đánh giá
exports.toggleVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
        }

        review.isHidden = !review.isHidden;
        await review.save();

        res.status(200).json({ 
            success: true, 
            data: review, 
            message: review.isHidden ? 'Đã ẩn đánh giá khỏi cửa hàng.' : 'Đã hiện lại đánh giá trên cửa hàng.' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
