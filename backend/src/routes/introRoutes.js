const express = require('express');
const router = express.Router();
const { getIntros, getIntroByType, upsertIntro } = require('../controllers/introController');
const { protect, authorize } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

router.get('/', getIntros);
router.get('/:type', getIntroByType);
router.post('/', protect, authorize('admin'), upload.single('image'), upsertIntro);

module.exports = router;
