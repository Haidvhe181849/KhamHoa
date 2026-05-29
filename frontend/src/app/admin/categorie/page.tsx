"use client";

import React, { useState, useEffect } from "react";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import { 
  FolderTree, Plus, Edit3, Trash2, RotateCw, Loader2, 
  Sparkles, X, FolderHeart, Eye, ToggleLeft, ToggleRight, AlertTriangle 
} from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { useConfirm } from "@/components/ui/ConfirmContext";

interface CategoryData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  menuGroup: "TRANG_SUC" | "PHU_KIEN" | "QUA_TANG";
  displayOrder: number;
  showInMenu: boolean;
  createdAt: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [menuGroup, setMenuGroup] = useState<"TRANG_SUC" | "PHU_KIEN" | "QUA_TANG">("TRANG_SUC");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [showInMenu, setShowInMenu] = useState(true);

  const toast = useToast();
  const { confirm } = useConfirm();

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/categories`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCategories(data.data || []);
      } else {
        setError(data.message || "Không thể tải danh sách danh mục.");
      }
    } catch (err) {
      setError("Lỗi kết nối máy chủ quản lý danh mục.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openForm = (cat: CategoryData | null = null) => {
    setEditingCategory(cat);
    if (cat) {
      setName(cat.name);
      setDescription(cat.description || "");
      setMenuGroup(cat.menuGroup);
      setDisplayOrder(cat.displayOrder.toString());
      setShowInMenu(cat.showInMenu);
    } else {
      setName("");
      setDescription("");
      setMenuGroup("TRANG_SUC");
      setDisplayOrder("0");
      setShowInMenu(true);
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (!name.trim() || !menuGroup) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      setActionLoading(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        menuGroup,
        displayOrder: Number(displayOrder) || 0,
        showInMenu
      };

      let res;
      if (editingCategory) {
        // PUT update
        res = await fetchWithAuth(`${API_BASE_URL}/api/categories/${editingCategory._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // POST create
        res = await fetchWithAuth(`${API_BASE_URL}/api/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(editingCategory ? "Cập nhật danh mục thành công!" : "Tạo danh mục thành công!");
        setIsFormOpen(false);
        await fetchCategories();
      } else {
        toast.error(data.message || "Lỗi xử lý nghiệp vụ danh mục.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối cập nhật danh mục.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    confirm({
      title: "Xóa danh mục",
      message: `Bạn có chắc chắn muốn xóa danh mục "${catName}"? Hành động này sẽ khóa nếu danh mục vẫn chứa sản phẩm.`,
      variant: "danger",
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/categories/${catId}`, {
            method: "DELETE"
          });
          const data = await res.json();

          if (res.ok && data.success) {
            toast.success("Đã xóa danh mục thành công!");
            await fetchCategories();
          } else {
            // Backend integrity lock trigger
            toast.error(data.message || "Lỗi xóa danh mục.");
          }
        } catch (err) {
          toast.error("Lỗi kết nối máy chủ xóa danh mục.");
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const getGroupLabel = (group: string) => {
    const mapping: Record<string, string> = {
      TRANG_SUC: "Trang sức xà cừ",
      PHU_KIEN: "Phụ kiện cao cấp",
      QUA_TANG: "Quà tặng mỹ nghệ"
    };
    return mapping[group] || group;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-white font-semibold">
            QUẢN LÝ DANH MỤC
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-[0.2em] font-medium">
            Phân nhóm sản phẩm Trang sức, Phụ kiện, Quà tặng Khảm Hoa
          </p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#c9a15c] hover:bg-[#b88f4b] text-[#14110F] text-xs font-bold rounded-full transition-all cursor-pointer shadow-lg hover:shadow-[#c9a15c]/10 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Thêm danh mục
        </button>
      </div>

      {/* WARNING NOTIFICATION INTEGRITY BANNER */}
      <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl flex gap-3 items-start backdrop-blur-md">
        <AlertTriangle className="w-5 h-5 text-[#c9a15c] shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed text-gray-300 font-semibold">
          <span className="text-[#c9a15c] font-extrabold block uppercase tracking-wider mb-1">Ràng buộc dữ liệu bảo toàn (Relational Integrity Lock):</span>
          Để bảo vệ dữ liệu lịch sử bán hàng và tránh lỗi mồ côi sản phẩm, hệ thống Khảm Hoa nghiêm cấm xóa danh mục đang có sản phẩm. Vui lòng di chuyển hoặc dọn dẹp sản phẩm trước khi thực hiện xóa.
        </div>
      </div>

      {/* CATEGORIES DATATABLE */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C1816] text-[#c9a15c] uppercase font-bold tracking-widest text-[9px] border-b border-white/[0.06]">
                <th className="px-5 py-4">Tên Danh Mục</th>
                <th className="px-5 py-4">Slug Định Danh</th>
                <th className="px-5 py-4">Độ ưu tiên (Display Order)</th>
                <th className="px-5 py-4">Hiển Thị</th>
                <th className="px-5 py-4">Ngày Tạo</th>
                <th className="px-5 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] bg-[#161311]/40">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-white/[0.01] transition-colors group">
                    
                    <td className="px-5 py-4 font-bold text-white flex items-center gap-2.5">
                      <FolderHeart className="w-4 h-4 text-[#c9a15c] shrink-0" />
                      <div>
                        <span className="group-hover:text-[#c9a15c] transition-colors">{cat.name}</span>
                        {cat.description && (
                          <span className="block text-[9px] text-gray-500 font-medium font-normal mt-0.5 truncate max-w-[200px]">
                            {cat.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-gray-500 font-semibold">{cat.slug}</td>

                    <td className="px-5 py-4 font-bold text-white pl-10">{cat.displayOrder}</td>

                    <td className="px-5 py-4">
                      {cat.showInMenu ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <ToggleRight className="w-5 h-5 text-emerald-400" /> Bật
                        </span>
                      ) : (
                        <span className="text-gray-500 font-bold flex items-center gap-1">
                          <ToggleLeft className="w-5 h-5 text-gray-600" /> Tắt
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-500 font-medium">
                      {new Date(cat.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openForm(cat)}
                          title="Sửa thông tin danh mục"
                          className="p-2 text-gray-400 hover:text-[#c9a15c] hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat._id, cat.name)}
                          title="Xóa danh mục"
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
                    {loading ? "Đang kết nối tải danh mục..." : "Chưa có danh mục sản phẩm nào."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT CATEGORY MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1C1816] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-white/[0.06] mb-4">
              <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#c9a15c]" /> {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trang sức khảm ngọc..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                />
              </div>

              {/* Display Order */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thứ tự hiển thị (Display Order)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 = Mặc định"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                />
              </div>

              {/* Category Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mô tả ngắn</label>
                <textarea
                  placeholder="Nhập mô tả tóm tắt ý nghĩa danh mục..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all resize-none"
                />
              </div>

              {/* Toggle show in menu */}
              <div className="flex justify-between items-center py-2 border-t border-b border-white/[0.04]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hiển thị trên Header</span>
                <button
                  type="button"
                  onClick={() => setShowInMenu(!showInMenu)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  {showInMenu ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <ToggleRight className="w-6 h-6 text-emerald-400" /> Bật hiển thị
                    </span>
                  ) : (
                    <span className="text-gray-500 font-bold flex items-center gap-1.5">
                      <ToggleLeft className="w-6 h-6 text-gray-600" /> Tắt hiển thị
                    </span>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-full cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#c9a15c] hover:bg-[#b88f4b] disabled:bg-gray-800 disabled:text-gray-600 text-[#14110F] text-xs font-bold rounded-full tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-[0.98]"
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
