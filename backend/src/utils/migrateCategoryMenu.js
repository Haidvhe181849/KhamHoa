const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const { createSlug } = require('./slugify');

dotenv.config({ path: './.env' });

/** Gán menuGroup theo slug (danh mục đã có trong DB) */
const SLUG_MENU_MAP = {
    nhan: 'TRANG_SUC',
    'khuyen-tai': 'TRANG_SUC',
    luoc: 'PHU_KIEN',
    'cham-cai-toc': 'PHU_KIEN',
    'qua-sinh-nhat': 'QUA_TANG',
    'qua-ky-niem': 'QUA_TANG'
};

const DEFAULT_MENU_CATEGORIES = [
    { name: 'Nhẫn khảm trai', menuGroup: 'TRANG_SUC', displayOrder: 1, description: 'Nhẫn mỹ nghệ khảm trai, xà cừ cao cấp.' },
    { name: 'Khuyên tai', menuGroup: 'TRANG_SUC', displayOrder: 2, description: 'Bông tai khảm trai thanh lịch.' },
    { name: 'Lược chải tóc', menuGroup: 'PHU_KIEN', displayOrder: 1, description: 'Lược gỗ khảm trai thủ công.' },
    { name: 'Trâm cài tóc', menuGroup: 'PHU_KIEN', displayOrder: 2, description: 'Trâm cài tóc khảm trai cổ phục.' },
    { name: 'Quà sinh nhật', menuGroup: 'QUA_TANG', displayOrder: 1, description: 'Quà tặng sinh nhật ý nghĩa.' },
    { name: 'Quà kỷ niệm', menuGroup: 'QUA_TANG', displayOrder: 2, description: 'Quà tặng kỷ niệm tinh tế.' }
];

function guessMenuGroup(category) {
    if (category.slug && SLUG_MENU_MAP[category.slug]) {
        return SLUG_MENU_MAP[category.slug];
    }

    const name = (category.name || '').toLowerCase();

    if (/nhẫn|khuyên|vòng|lắc|dây chuyền|trang sức/.test(name)) return 'TRANG_SUC';
    if (/lược|trâm|phụ kiện|gương|móc khóa/.test(name)) return 'PHU_KIEN';
    if (/quà|sinh nhật|kỷ niệm|lưu niệm/.test(name)) return 'QUA_TANG';

    return 'TRANG_SUC';
}

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Đã kết nối Database — migrate menuGroup cho Category...');

        const categories = await Category.find();
        let updated = 0;

        for (const cat of categories) {
            const needsMenuGroup = !cat.menuGroup;
            const updates = {};

            if (needsMenuGroup) {
                updates.menuGroup = guessMenuGroup(cat);
                updates.showInMenu = cat.showInMenu !== false;
                if (cat.displayOrder === undefined || cat.displayOrder === null) {
                    updates.displayOrder = 0;
                }
            }

            if (Object.keys(updates).length > 0) {
                await Category.updateOne({ _id: cat._id }, { $set: updates });
                updated++;
                console.log(`  ✓ ${cat.name} → ${updates.menuGroup}`);
            }
        }

        if (categories.length === 0) {
            console.log('Chưa có danh mục — tạo bộ danh mục menu mặc định...');
            for (const item of DEFAULT_MENU_CATEGORIES) {
                await Category.create({
                    ...item,
                    slug: createSlug(item.name),
                    showInMenu: true
                });
                console.log(`  + ${item.name} (${item.menuGroup})`);
            }
            updated = DEFAULT_MENU_CATEGORIES.length;
        }

        console.log(`--- Hoàn tất: cập nhật/tạo ${updated} danh mục ---`);
        process.exit(0);
    } catch (err) {
        console.error('Lỗi migrate:', err);
        process.exit(1);
    }
}

migrate();
