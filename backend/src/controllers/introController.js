const Introduction = require('../models/Introduction');

// Lấy danh sách nội dung giới thiệu
exports.getIntros = async (req, res) => {
    try {
        const intros = await Introduction.find();
        res.status(200).json({ success: true, data: intros });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy nội dung theo loại (material, process, history)
exports.getIntroByType = async (req, res) => {
    try {
        const intro = await Introduction.findOne({ type: req.params.type });
        if (!intro) return res.status(404).json({ success: false, message: 'Không tìm thấy nội dung' });
        res.status(200).json({ success: true, data: intro });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm/Cập nhật nội dung giới thiệu (Admin)
exports.upsertIntro = async (req, res) => {
    try {
        const { title, content, type } = req.body;
        let imageData = {};

        if (req.file) {
            imageData = {
                public_id: req.file.filename,
                url: req.file.path
            };
        }

        const intro = await Introduction.findOneAndUpdate(
            { type },
            { 
                title, 
                content, 
                type,
                ...(req.file && { image: imageData })
            },
            { returnDocument: 'after', upsert: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: intro });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
