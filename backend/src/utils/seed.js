const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Introduction = require('../models/Introduction');
const { createSlug } = require('./slugify');

dotenv.config({ path: './.env' });

const categories = [
    { name: 'Nhẫn khảm trai', menuGroup: 'TRANG_SUC', displayOrder: 1, description: 'Nhẫn mỹ nghệ khảm trai, xà cừ cao cấp.' },
    { name: 'Khuyên tai', menuGroup: 'TRANG_SUC', displayOrder: 2, description: 'Bông tai khảm trai thanh lịch.' },
    { name: 'Lược chải tóc', menuGroup: 'PHU_KIEN', displayOrder: 1, description: 'Lược gỗ khảm trai thủ công.' },
    { name: 'Trâm cài tóc', menuGroup: 'PHU_KIEN', displayOrder: 2, description: 'Trâm cài tóc khảm trai cổ phục.' },
    { name: 'Quà sinh nhật', menuGroup: 'QUA_TANG', displayOrder: 1, description: 'Quà tặng sinh nhật ý nghĩa — admin thêm sản phẩm sau.' },
    { name: 'Quà kỷ niệm', menuGroup: 'QUA_TANG', displayOrder: 2, description: 'Quà tặng kỷ niệm tinh tế — admin thêm sản phẩm sau.' }
];

const intros = [
    {
        type: 'history',
        title: 'Câu Chuyện Khảm Hoa',
        content: '<p>Khảm Hoa được hình thành từ niềm yêu thích đối với nghệ thuật khảm trai. Xem chi tiết trên website.</p>',
        image: { url: 'https://res.cloudinary.com/dt9yr0sgp/image/upload/v1/samples/landscapes/beach-boat.jpg' }
    },
    {
        type: 'return',
        title: 'Chính Sách Đổi Trả',
        content: '<ul><li>Đổi/trả trong <strong>7 ngày</strong> — sản phẩm chưa sử dụng, còn nguyên hộp.</li><li>Lỗi sản xuất: đổi mới hoặc hoàn tiền 100%.</li><li>Hotline: <strong>1800 6868</strong></li></ul>'
    },
    {
        type: 'shipping',
        title: 'Chính Sách Vận Chuyển',
        content: '<ul><li>Nội thành HCM/HN: 1–2 ngày làm việc.</li><li>Tỉnh khác: 2–5 ngày.</li><li>Phí 30.000₫ — <strong>miễn phí</strong> đơn từ 500.000₫.</li></ul>'
    },
    {
        type: 'maintenance',
        title: 'Hỗ Trợ Bảo Quản',
        content: '<ul><li>Tránh nắng gắt và hóa chất mạnh.</li><li>Lau khăn mềm, bảo quản riêng trong hộp.</li><li>Bảo hành trọn đời độ bám mảnh khảm khi bảo quản đúng cách.</li></ul>'
    }
];

const productSamplesByGroup = {
    TRANG_SUC: ['Nhẫn Khảm Hoa Sen', 'Khuyên Tai Giọt Nước', 'Nhẫn Xà Cừ Trắng', 'Khuyên Tai Tròn Cổ Điển', 'Nhẫn Ngọc Trai'],
    PHU_KIEN: ['Lược Khảm Trai Dáng Tròn', 'Trâm Cài Hoa Đào', 'Lược Cầm Tay Nghệ Nhân', 'Trâm Cài Tóc Cổ Phục', 'Lược Gỗ Khảm Sen'],
    QUA_TANG: ['Hộp Quà Khảm Trai', 'Set Quà Sinh Nhật', 'Khay Trà Quà Tặng', 'Hộp Đựng Trang Sức Quà', 'Bộ Quà Kỷ Niệm']
};

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Đã kết nối Database để đổ dữ liệu...');

        await Category.deleteMany();
        await Product.deleteMany();
        await Introduction.deleteMany();

        const createdCategories = await Category.insertMany(
            categories.map((c) => ({
                ...c,
                slug: createSlug(c.name),
                showInMenu: true
            }))
        );
        console.log(`Đã thêm ${createdCategories.length} danh mục (có menuGroup).`);

        const products = [];

        for (const category of createdCategories) {
            const samples = productSamplesByGroup[category.menuGroup] || ['Sản phẩm mẫu'];
            for (let j = 0; j < Math.min(5, samples.length); j++) {
                const name = `${samples[j % samples.length]} — ${category.name}`;
                products.push({
                    name,
                    slug: createSlug(name),
                    price: Math.floor(Math.random() * (2000000 - 300000) + 300000),
                    stock: Math.floor(Math.random() * 50) + 10,
                    sold: Math.floor(Math.random() * 200) + 5,
                    description: `Sản phẩm thuộc danh mục ${category.name}, chế tác thủ công khảm trai cao cấp.`,
                    categoryId: category._id,
                    images: [{ url: 'https://res.cloudinary.com/dt9yr0sgp/image/upload/v1/samples/ecommerce/accessories-bag.jpg', public_id: 'sample' }]
                });
            }
        }

        await Product.insertMany(products);
        console.log(`Đã thêm ${products.length} sản phẩm.`);

        await Introduction.insertMany(intros);
        console.log('Đã thêm bài viết giới thiệu và chính sách.');

        console.log('--- HOÀN TẤT ĐỔ DỮ LIỆU THÀNH CÔNG! ---');
        process.exit();
    } catch (err) {
        console.error('Lỗi khi đổ dữ liệu:', err);
        process.exit(1);
    }
};

seedDB();
