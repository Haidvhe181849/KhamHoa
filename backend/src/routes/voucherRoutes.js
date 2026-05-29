const express = require('express');
const router = express.Router();
const { getAllVouchers, createVoucher, deleteVoucher, applyVoucher, updateVoucher } = require('../controllers/voucherController');
const { protect, authorize } = require('../middlewares/auth');

// Public or Admin (Controller handles filtering)
router.get('/', async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
        } catch (err) {}
    }
    next();
}, getAllVouchers);
router.post('/apply', applyVoucher);

// Admin Only
router.post('/', protect, authorize('admin'), createVoucher);
router.put('/:id', protect, authorize('admin'), updateVoucher);
router.delete('/:id', protect, authorize('admin'), deleteVoucher);

module.exports = router;
