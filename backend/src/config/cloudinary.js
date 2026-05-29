const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ CẢNH BÁO: Thiếu cấu hình Cloudinary trong file .env. Việc upload ảnh sẽ thất bại!');
} else {
    console.log('☁️ Đang nạp cấu hình Cloudinary cho:', process.env.CLOUDINARY_CLOUD_NAME.substring(0, 3) + '...');
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'khamhoa_store',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Giới hạn kích thước file tải lên tối đa 10MB (Hỗ trợ ảnh độ phân giải cao)
    },
    fileFilter: (req, file, cb) => {
        // Chỉ chấp nhận các MIME type hình ảnh thực tế (Tránh bypass bằng đuôi mở rộng giả)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận định dạng hình ảnh hợp lệ (.jpg, .jpeg, .png, .webp)'), false);
        }
    }
});

module.exports = { cloudinary, upload };
