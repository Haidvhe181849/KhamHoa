const Cart = require('../models/Cart');

// API: Lấy giỏ hàng của user
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        
        let cart = await Cart.findOne({ userId })
            .populate({
                path: 'items.productId',
                select: 'name price images categoryId',
                populate: {
                    path: 'categoryId',
                    select: 'name'
                }
            });

        if (!cart) {
            cart = await Cart.create({ userId, items: [] });
        }

        // Ánh xạ sang định dạng Frontend đang dùng (id, name, price, image, quantity, categoryName, selected)
        const formattedItems = cart.items
            .filter(item => item.productId) // Loại bỏ nếu product đã bị xóa
            .map(item => ({
                id: item.productId._id.toString(),
                name: item.productId.name,
                price: item.productId.price,
                image: item.productId.images?.[0]?.url || '',
                quantity: item.quantity,
                categoryName: item.productId.categoryId?.name || '',
                selected: item.selected
            }));

        res.status(200).json({ success: true, data: formattedItems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API: Đồng bộ giỏ hàng lên server
exports.syncCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { items } = req.body; // Array [{ id, quantity, selected }]

        if (!Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu giỏ hàng không hợp lệ' });
        }

        // Ánh xạ lại thành { productId, quantity, selected } cho đúng schema Backend
        const dbItems = items.map(item => ({
            productId: item.id,
            quantity: item.quantity || 1,
            selected: item.selected !== undefined ? item.selected : true
        }));

        const cart = await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: dbItems } },
            { new: true, upsert: true } // Nếu chưa có thì tự động tạo mới
        );

        res.status(200).json({ success: true, message: 'Đồng bộ giỏ hàng thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
