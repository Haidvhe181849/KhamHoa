const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');

// GET /api/cart - Lấy giỏ hàng của user đang đăng nhập
router.get('/', protect, cartController.getCart);

// PUT /api/cart - Đồng bộ mảng giỏ hàng mới lên Server
router.put('/', protect, cartController.syncCart);

module.exports = router;
