"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import {
  Search, Box, Plus, Edit3, Trash2, Loader2, Sparkles, X,
  Upload, Image as ImageIcon, AlertCircle, RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { useConfirm } from "@/components/ui/ConfirmContext";

interface CategoryData {
  _id: string;
  name: string;
  menuGroup: string;
}

interface ProductImage {
  url: string;
  publicId?: string;
  public_id?: string;
}

interface ProductData {
  _id: string;
  name: string;
  price: number;
  stock: number;
  sold: number;
  description: string;
  categoryId: CategoryData | null;
  images: ProductImage[];
  createdAt: string;
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#c9a15c] animate-spin" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();

  // State Management
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination & Filter state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(8);

  // Modal forms states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // File upload previews states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);

  // Load Categories listing
  const fetchCategories = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/categories`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh mục:", err);
    }
  };

  // Load Products listing
  const fetchProducts = async (page = 1, searchStr = search, catFilter = categoryFilter) => {
    setLoading(true);
    setError("");
    try {
      let query = `page=${page}&limit=${limit}`;
      if (searchStr) query += `&search=${encodeURIComponent(searchStr)}`;
      if (catFilter !== "ALL") query += `&categoryId=${catFilter}`;

      const res = await fetchWithAuth(`${API_BASE_URL}/api/products?${query}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setProducts(data.data || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } else {
        setError(data.message || "Không thể tải danh sách sản phẩm.");
      }
    } catch (err) {
      setError("Lỗi kết nối máy chủ quản lý sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1, search, categoryFilter);
  };

  const handleCategoryFilterChange = (catId: string) => {
    setCategoryFilter(catId);
    fetchProducts(1, search, catId);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchProducts(page, search, categoryFilter);
    }
  };

  // Open Add/Edit forms
  const openForm = (prod: ProductData | null = null) => {
    setEditingProduct(prod);
    setSelectedFiles([]);
    setPreviewUrls([]);

    if (prod) {
      setName(prod.name);
      setPrice(prod.price.toLocaleString("vi-VN"));
      setStock(prod.stock.toLocaleString("vi-VN"));
      setDescription(prod.description);
      setCategoryId(prod.categoryId?._id || "");
      setExistingImages(prod.images || []);
    } else {
      setName("");
      setPrice("");
      setStock("");
      setDescription("");
      setCategoryId(categories[0]?._id || "");
      setExistingImages([]);
    }
    setIsFormOpen(true);
  };

  const handleNumberInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    if (!isNaN(Number(rawValue)) && rawValue !== '') {
      setter(Number(rawValue).toLocaleString('vi-VN'));
    } else if (rawValue === '') {
      setter('');
    }
  };

  // Handle image changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // Enforce up to 5 images max
      const nextFiles = [...selectedFiles, ...files].slice(0, 5);
      setSelectedFiles(nextFiles);

      const urls = nextFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const removeFile = (index: number) => {
    const nextFiles = selectedFiles.filter((_, idx) => idx !== index);
    setSelectedFiles(nextFiles);

    const urls = nextFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Submit CRUD product
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (!name.trim() || !price || !stock || !description.trim() || !categoryId) {
      toast.error("Vui lòng nhập đầy đủ tất cả các trường thông tin bắt buộc.");
      setActionLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("price", price.replace(/\./g, ''));
      formData.append("stock", stock.replace(/\./g, ''));
      formData.append("description", description.trim());
      formData.append("categoryId", categoryId);

      // Append upload files
      selectedFiles.forEach(file => {
        formData.append("images", file);
      });

      // If editing, append remaining existing images
      if (editingProduct) {
        formData.append("existingImages", JSON.stringify(existingImages));
      }

      let res;
      try {
        if (editingProduct) {
          // Update product PUT
          res = await fetchWithAuth(`${API_BASE_URL}/api/products/${editingProduct._id}`, {
            method: "PUT",
            body: formData
          });
        } else {
          // Create product POST
          res = await fetchWithAuth(`${API_BASE_URL}/api/products`, {
            method: "POST",
            body: formData
          });
        }
      } catch (networkErr: any) {
        console.error("Lỗi kết nối mạng:", networkErr);
        toast.error(`Không thể kết nối tới máy chủ (${API_BASE_URL}). Vui lòng kiểm tra xem Backend đã khởi chạy chưa hoặc có bị chặn CORS/Nginx không! Chi tiết: ${networkErr.message || networkErr}`);
        setActionLoading(false);
        return;
      }

      // Xử lý phản hồi từ server
      let data;
      const contentType = res.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        // Phản hồi không phải là JSON (thường là trang lỗi HTML của Nginx hoặc Express crash)
        const responseText = await res.text();
        console.error("Phản hồi không hợp lệ từ server (không phải JSON):", responseText);
        
        if (res.status === 413) {
          toast.error("❌ LỖI 413 (Dung lượng quá lớn): Hình ảnh bạn chọn vượt quá giới hạn tải lên của Nginx trên VPS (mặc định là 1MB). Hãy nén ảnh xuống dưới 1MB hoặc thêm cấu hình 'client_max_body_size 10M;' vào file cấu hình Nginx của VPS!");
        } else if (res.status === 502) {
          toast.error("❌ LỖI 502 (Bad Gateway): Cổng kết nối giữa Nginx và Node.js Backend bị gián đoạn. Vui lòng kiểm tra xem backend có đang hoạt động trên port 5000 không!");
        } else {
          toast.error(`❌ LỖI HỆ THỐNG (Mã ${res.status}): Máy chủ trả về phản hồi không hợp lệ. Vui lòng kiểm tra nhật ký lỗi (logs) của backend.`);
        }
        setActionLoading(false);
        return;
      }

      try {
        data = await res.json();
      } catch (parseErr: any) {
        console.error("Lỗi parse JSON:", parseErr);
        toast.error(`Không thể đọc định dạng dữ liệu trả về từ máy chủ. Chi tiết: ${parseErr.message}`);
        setActionLoading(false);
        return;
      }

      if (res.ok && data.success) {
        toast.success(editingProduct ? "Cập nhật sản phẩm thành công!" : "Tạo sản phẩm thành công!");
        setIsFormOpen(false);
        await fetchProducts(currentPage);
      } else {
        // Hiển thị chi tiết lỗi nghiệp vụ từ backend
        const errorMessage = data.message || "Lỗi xử lý nghiệp vụ sản phẩm.";
        if (errorMessage.includes("categoryId") || errorMessage.includes("Category")) {
          toast.error(`❌ Lỗi Danh mục: Danh mục bạn chọn không tồn tại hoặc ID không hợp lệ trong database Atlas!`);
        } else if (res.status === 401 || res.status === 403) {
          toast.error(`❌ Lỗi bảo mật (${res.status}): Phiên đăng nhập Admin của bạn đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!`);
        } else if (res.status === 500) {
          toast.error(`❌ Lỗi Server (500): ${errorMessage} (Hãy kiểm tra cấu hình Cloudinary và kết nối MongoDB Atlas của backend)`);
        } else {
          toast.error(`❌ Thất bại: ${errorMessage}`);
        }
      }
    } catch (err: any) {
      console.error("Lỗi tổng quát:", err);
      toast.error(`Lỗi hệ thống: ${err.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete product call
  const handleDeleteProduct = (prodId: string, name: string) => {
    confirm({
      title: "Xóa sản phẩm",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${name}" khỏi catalog cửa hàng? Hành động này không thể hoàn tác.`,
      variant: "danger",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/products/${prodId}`, {
            method: "DELETE"
          });
          const data = await res.json();

          if (res.ok && data.success) {
            toast.success("Đã xóa sản phẩm thành công!");
            await fetchProducts(currentPage);
          } else {
            toast.error(data.message || "Lỗi xóa sản phẩm.");
          }
        } catch (err) {
          toast.error("Lỗi kết nối máy chủ xóa sản phẩm.");
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-white font-semibold">
            QUẢN LÝ SẢN PHẨM
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-[0.2em] font-medium">
            Danh mục sản phẩm, cập nhật giá thành & tồn kho
          </p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#c9a15c] hover:bg-[#b88f4b] text-[#14110F] text-xs font-bold rounded-full transition-all cursor-pointer shadow-lg hover:shadow-[#c9a15c]/10 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Thêm sản phẩm
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl backdrop-blur-md">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

          {/* Search Input */}
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1C1816] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all cursor-pointer font-semibold"
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Search Action */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => { setSearch(""); setCategoryFilter("ALL"); fetchProducts(1, "", "ALL"); }}
              className="p-2.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>

        </form>
      </div>

      {/* PRODUCTS DISPLAY LIST TABLE */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C1816] text-[#c9a15c] uppercase font-bold tracking-widest text-[9px] border-b border-white/[0.06]">
                <th className="px-5 py-4">Sản Phẩm</th>
                <th className="px-5 py-4">Danh Mục</th>
                <th className="px-5 py-4">Giá Bán</th>
                <th className="px-5 py-4">Tồn Kho</th>
                <th className="px-5 py-4">Đã Bán</th>
                <th className="px-5 py-4">Ngày Thêm</th>
                <th className="px-5 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] bg-[#161311]/40">
              {products.length > 0 ? (
                products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-white/[0.01] transition-colors group">

                    {/* Catalog Image + name snippet */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl border border-white/[0.08] overflow-hidden bg-[#1C1816] shrink-0 shadow">
                          {prod.images?.[0]?.url ? (
                            <img src={prod.images[0].url} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 text-[9px] text-gray-500 font-bold uppercase">No Pic</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white group-hover:text-[#c9a15c] transition-colors truncate max-w-[200px]">
                            {prod.name}
                          </h4>
                          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block mt-0.5 select-all">
                            ID: {prod._id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-300">
                      {prod.categoryId?.name || <span className="text-gray-600 italic">Không danh mục</span>}
                    </td>

                    <td className="px-5 py-4 font-extrabold text-[#c9a15c]">{formatPrice(prod.price)}</td>

                    <td className="px-5 py-4 font-semibold text-white">
                      {prod.stock <= 5 ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> Chỉ còn {prod.stock}
                        </span>
                      ) : (
                        <span>{prod.stock}</span>
                      )}
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-400">{prod.sold}</td>

                    <td className="px-5 py-4 text-gray-500 font-medium">
                      {new Date(prod.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openForm(prod)}
                          title="Sửa thông tin"
                          className="p-2 text-gray-400 hover:text-[#c9a15c] hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod._id, prod.name)}
                          title="Xóa mặt hàng"
                          className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500 italic">
                    {loading ? "Đang truy vấn dữ liệu sản phẩm..." : "Chưa có sản phẩm nào được nhập."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CUSTOM PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="bg-[#171412] px-6 py-4.5 border-t border-white/[0.06] flex items-center justify-between select-none">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
              Trang {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-4 py-1.5 bg-white/5 disabled:bg-gray-800/10 hover:bg-white/10 disabled:text-gray-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer border border-white/10"
              >
                Trước
              </button>
              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-4 py-1.5 bg-white/5 disabled:bg-gray-800/10 hover:bg-white/10 disabled:text-gray-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer border border-white/10"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-[#1C1816] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="bg-[#171412] px-6 py-4 border-b border-white/[0.06] flex justify-between items-center shrink-0">
              <h3 className="text-base font-serif font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#c9a15c]" /> {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">

              {/* Product name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lọ hoa Khảm Xà Cừ dáng bầu..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                />
              </div>

              {/* Double column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giá bán (VNĐ) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Giá trị VNĐ"
                    value={price}
                    onChange={handleNumberInput(setPrice)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                  />
                </div>

                {/* Stock */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tồn kho *</label>
                  <input
                    type="text"
                    required
                    placeholder="Số lượng nhập kho"
                    value={stock}
                    onChange={handleNumberInput(setStock)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                  />
                </div>

                {/* Category ID select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Danh mục *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#14110F] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all cursor-pointer font-semibold"
                  >
                    <option value="" disabled>Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Product description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mô tả sản phẩm *</label>
                <textarea
                  required
                  placeholder="Mô tả chất liệu khảm trai, xà cừ, quy trình nghệ thuật, kích cỡ, chế độ bảo hành..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all resize-none"
                />
              </div>

              {/* High-fidelity custom Image Upload dropzone */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đăng tải hình ảnh xà cừ (Tối đa 5 ảnh)</label>

                {/* File Dropzone */}
                <div className="relative border-2 border-dashed border-white/[0.08] hover:border-[#c9a15c]/50 rounded-2xl p-6 text-center transition-all bg-[#171412]/40 select-none">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-[#c9a15c] mx-auto mb-2.5 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-white">Bấm hoặc kéo thả hình ảnh sản phẩm vào đây</p>
                  <p className="text-[10px] text-gray-500 mt-1">Hỗ trợ PNG, JPG, JPEG chất lượng cao (Tối đa 5 ảnh)</p>
                </div>

                {/* Previews current existing files (when editing) */}
                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-[#c9a15c] font-black">Ảnh đã lưu hiện tại:</span>
                    <div className="grid grid-cols-5 gap-3.5">
                      {existingImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="relative w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-white/5 shadow group focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                        >
                          <img src={img.url} alt="existing product pic" className="w-full h-full object-cover transition-transform group-hover:scale-105 group-focus:scale-105" />

                          {/* Overlay mờ khi tương tác */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200" />

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              removeExistingImage(idx);
                            }}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 group-focus:scale-100 cursor-pointer"
                            title="Xóa ảnh cũ"
                          >
                            <div className="bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700">
                              <Trash2 className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Previews selected files grid */}
                {previewUrls.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-black">Ảnh mới chuẩn bị tải lên:</span>
                    <div className="grid grid-cols-5 gap-3.5">
                      {previewUrls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="relative w-16 h-16 rounded-xl border border-emerald-500/10 overflow-hidden bg-white/5 shadow group focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                          <img src={url} alt="upload preview" className="w-full h-full object-cover transition-transform group-hover:scale-105 group-focus:scale-105" />

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200" />

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(idx);
                            }}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 group-focus:scale-100 cursor-pointer"
                            title="Xóa ảnh này"
                          >
                            <div className="bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700">
                              <Trash2 className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-full transition-all cursor-pointer border border-white/10"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-[#c9a15c] hover:bg-[#b88f4b] disabled:bg-gray-800 disabled:text-gray-600 text-[#14110F] text-xs font-bold rounded-full tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-[0.98]"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác nhận
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
