const Product = require('../models/Product');
const Category = require('../models/Category');
const { createSlug } = require('../utils/slugify');

// Lấy tất cả sản phẩm (phân trang + filter đầy đủ)
exports.getAllProducts = async (req, res) => {
    try {
        const {
            categoryId,
            categoryIds,
            menuGroup,
            sort = '-sold',
            page = 1,
            limit = 10,
            search = '',
            minPrice,
            maxPrice
        } = req.query;

        // Build query
        let query = {};
        if (categoryId) {
            query.categoryId = categoryId;
        } else if (categoryIds) {
            const ids = categoryIds.split(',').filter(Boolean);
            query.categoryId = { $in: ids };
        } else if (menuGroup) {
            const categories = await Category.find({ menuGroup }).select('_id');
            query.categoryId = { $in: categories.map((c) => c._id) };
        }
        if (search) {
            // Vá lỗi ReDoS bằng cách xóa các ký tự đặc biệt của biểu thức chính quy (Regex) trước khi đưa vào truy vấn
            const safeSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            query.name = { $regex: safeSearch, $options: 'i' };
        }
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Sort
        const sortBy = sort.split(',').join(' ');

        // Pagination
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;

        const total = await Product.countDocuments(query);
        const totalPages = Math.ceil(total / limitNum);

        const products = await Product.find(query)
            .populate('categoryId', 'name slug menuGroup')
            .sort(sortBy)
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            total,
            totalPages,
            currentPage: Number(pageNum),
            data: products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy chi tiết 1 sản phẩm
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('categoryId', 'name');
        if (!product) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        
        // Lấy sản phẩm tương tự (cùng danh mục, tối đa 4 cái)
        const related = await Product.find({
            categoryId: product.categoryId?._id,
            _id: { $ne: product._id }
        }).limit(4);

        res.status(200).json({ 
            success: true, 
            data: product,
            related: related 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Lấy chi tiết sản phẩm
exports.getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug }).populate('categoryId');
        if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm sản phẩm mới (Admin)
exports.createProduct = async (req, res) => {
    try {
        const { name, price, stock, sold, description, categoryId } = req.body;
        
        // Kiểm tra trùng tên
        const existingProduct = await Product.findOne({ name });
        if (existingProduct) {
            return res.status(400).json({ success: false, message: 'Tên sản phẩm này đã tồn tại, vui lòng chọn tên khác!' });
        }
        
        // Xử lý ảnh từ Cloudinary (Multer upload trước đó)
        let images = [];
        if (req.files) {
            images = req.files.map(file => ({
                publicId: file.filename,
                public_id: file.filename,
                url: file.path
            }));
        }

        const product = await Product.create({
            name,
            slug: createSlug(name),
            price,
            stock,
            sold,
            description,
            categoryId,
            images
        });

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Cập nhật sản phẩm (Admin)
exports.updateProduct = async (req, res) => {
    try {
        const { name } = req.body;
        if (name) {
            const existingProduct = await Product.findOne({ name, _id: { $ne: req.params.id } });
            if (existingProduct) {
                return res.status(400).json({ success: false, message: 'Tên sản phẩm này đã tồn tại ở một mặt hàng khác!' });
            }
            req.body.slug = createSlug(name);
        }
        
        // Xử lý ảnh (cũ + mới)
        let updatedImages = [];
        if (req.body.existingImages) {
            try {
                updatedImages = JSON.parse(req.body.existingImages);
            } catch (e) {}
        }
        
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                publicId: file.filename,
                public_id: file.filename,
                url: file.path
            }));
            updatedImages = [...updatedImages, ...newImages];
        }

        if (req.body.existingImages || (req.files && req.files.length > 0)) {
            req.body.images = updatedImages;
        }

        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true
        });

        if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa sản phẩm (Admin)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        res.status(200).json({ success: true, message: 'Đã xóa sản phẩm thành công' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
