const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

// ==========================================
// ADMIN ROUTES
// ==========================================
router.get('/admin', protect, authorize('admin'), reviewController.getAdminReviews);
router.patch('/admin/:id/reply', protect, authorize('admin'), reviewController.replyReview);
router.patch('/admin/:id/toggle-visibility', protect, authorize('admin'), reviewController.toggleVisibility);

// ==========================================
// CUSTOMER & PUBLIC ROUTES
// ==========================================

// Check eligibility to review a product
router.get('/eligibility/:productId', protect, reviewController.checkEligibility);

// Create a review (with max 5 images)
router.post('/', protect, upload.array('images', 5), reviewController.createReview);

// Get public highlight reviews (for homepage)
router.get('/public', reviewController.getPublicReviews);

// Get reviews for a product (public)
router.get('/product/:productId', reviewController.getProductReviews);

module.exports = router;
