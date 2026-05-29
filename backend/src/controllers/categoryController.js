const Category = require('../models/Category');
const Product = require('../models/Product');
const { createSlug } = require('../utils/slugify');
const { isValidMenuGroup } = require('../constants/menuGroups');

const buildCategoryFilter = (query) => {
    const filter = {};

    if (query.showInMenu === 'true') {
        filter.showInMenu = true;
    }

    if (query.menuGroup && isValidMenuGroup(query.menuGroup)) {
        filter.menuGroup = query.menuGroup;
    }

    return filter;
};

exports.getAllCategories = async (req, res) => {
    try {
        const filter = buildCategoryFilter(req.query);
        const categories = await Category.find(filter)
            .sort({ menuGroup: 1, displayOrder: 1, name: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, menuGroup, displayOrder, showInMenu } = req.body;

        if (!isValidMenuGroup(menuGroup)) {
            return res.status(400).json({
                success: false,
                message: 'menuGroup không hợp lệ. Dùng: TRANG_SUC, PHU_KIEN, QUA_TANG'
            });
        }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Tên danh mục này đã tồn tại!' });
        }

        const category = await Category.create({
            name,
            slug: createSlug(name),
            description,
            menuGroup,
            displayOrder: displayOrder ?? 0,
            showInMenu: showInMenu !== false
        });

        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name, menuGroup } = req.body;

        if (menuGroup !== undefined && !isValidMenuGroup(menuGroup)) {
            return res.status(400).json({
                success: false,
                message: 'menuGroup không hợp lệ. Dùng: TRANG_SUC, PHU_KIEN, QUA_TANG'
            });
        }

        if (name) {
            const existingCategory = await Category.findOne({ name, _id: { $ne: req.params.id } });
            if (existingCategory) {
                return res.status(400).json({ success: false, message: 'Tên danh mục này đã tồn tại!' });
            }
            req.body.slug = createSlug(name);
        }

        const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true
        });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        // Kiểm tra xem danh mục có chứa sản phẩm nào hay không
        const productCount = await Product.countDocuments({ categoryId: req.params.id });
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa danh mục này vì đang có ${productCount} sản phẩm thuộc danh mục. Vui lòng dọn dẹp hoặc di chuyển sản phẩm trước.`
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }
        res.status(200).json({ success: true, message: 'Đã xóa danh mục thành công' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
