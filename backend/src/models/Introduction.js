const mongoose = require('mongoose');

const introductionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề là bắt buộc'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Nội dung là bắt buộc']
    },
    type: {
        type: String,
        enum: {
            values: ['history', 'return', 'shipping', 'maintenance', 'material', 'process', 'policy'],
            message: 'Loại nội dung: history, return, shipping, maintenance, ...'
        },
        required: true
    },
    image: {
        public_id: String,
        url: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Introduction', introductionSchema);
