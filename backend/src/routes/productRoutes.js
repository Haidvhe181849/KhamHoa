const express = require('express');
const router = express.Router();
const { 
    getAllProducts, 
    getProductBySlug,
    getProductById,
    createProduct, 
    updateProduct,
    deleteProduct 
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.get('/slug/:slug', getProductBySlug);

// Các route cần quyền Admin
router.post('/', protect, authorize('admin'), upload.array('images', 5), createProduct);
router.put('/:id', protect, authorize('admin'), upload.array('images', 5), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
