"use client";

import React, { useState, useEffect, Suspense } from "react";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import { 
  Search, Plus, Edit3, Trash2, Loader2, Sparkles, X, 
  Ticket, AlertCircle, RefreshCw 
} from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { useConfirm } from "@/components/ui/ConfirmContext";

interface VoucherData {
  _id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  description: string;
  createdAt: string;
}

export default function AdminVouchersPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#c9a15c] animate-spin" />
      </div>
    }>
      <VouchersContent />
    </Suspense>
  );
}

function VouchersContent() {
  const [vouchers, setVouchers] = useState<VoucherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");

  const toast = useToast();
  const { confirm } = useConfirm();

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherData | null>(null);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/vouchers`);
      const data = await res.json();
      if (res.ok && data.success) {
        setVouchers(data.data || []);
      } else {
        setError(data.message || "Lỗi khi lấy danh sách voucher.");
      }
    } catch (err) {
      setError("Lỗi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const openForm = (voucher: VoucherData | null = null) => {
    setEditingVoucher(voucher);
    if (voucher) {
      setCode(voucher.code);
      setDiscountType(voucher.discountType);
      setDiscountValue(voucher.discountValue.toString());
      setMaxDiscount(voucher.maxDiscount ? voucher.maxDiscount.toString() : "");
      setMinOrderValue(voucher.minOrderValue.toString());
      setExpiryDate(new Date(voucher.expiryDate).toISOString().split('T')[0]);
      setUsageLimit(voucher.usageLimit.toString());
      setIsActive(voucher.isActive);
      setDescription(voucher.description || "");
    } else {
      setCode("");
      setDiscountType("PERCENTAGE");
      setDiscountValue("");
      setMaxDiscount("");
      setMinOrderValue("0");
      setExpiryDate("");
      setUsageLimit("100");
      setIsActive(true);
      setDescription("");
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue || !expiryDate) {
      toast.error("Vui lòng điền các trường bắt buộc (Mã, Giá trị, Ngày hết hạn)!");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        code,
        discountType,
        discountValue: Number(discountValue),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        minOrderValue: Number(minOrderValue),
        expiryDate,
        usageLimit: Number(usageLimit),
        isActive,
        description
      };

      const url = editingVoucher 
        ? `${API_BASE_URL}/api/vouchers/${editingVoucher._id}`
        : `${API_BASE_URL}/api/vouchers`;
        
      const method = editingVoucher ? "PUT" : "POST";

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(editingVoucher ? "Cập nhật Voucher thành công!" : "Tạo Voucher thành công!");
        setIsFormOpen(false);
        fetchVouchers();
      } else {
        toast.error(data.message || "Lưu thất bại.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối mạng khi lưu voucher.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (id: string, code: string) => {
    confirm({
      title: "Xóa Voucher",
      message: `Bạn có chắc muốn xoá Voucher [${code}]? Hành động này không thể hoàn tác.`,
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/vouchers/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (res.ok && data.success) {
            toast.success(`Đã xoá Voucher [${code}]`);
            fetchVouchers();
          } else {
            toast.error(data.message || "Xoá thất bại.");
          }
        } catch (err) {
          toast.error("Lỗi kết nối khi xoá voucher.");
        }
      }
    });
  };

  const filteredVouchers = vouchers.filter(v => v.code.toLowerCase().includes(search.toLowerCase()));

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-semibold flex items-center gap-2 text-white">
            <Ticket className="w-6 h-6 text-[#c9a15c]" />
            Quản lý Voucher
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Thiết lập và quản lý các mã giảm giá cho hệ thống.
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-[#c9a15c] hover:bg-[#b58c49] text-[#14110F] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-[#c9a15c]/20"
        >
          <Plus className="w-4 h-4" /> Thêm Voucher
        </button>
      </div>

      <div className="bg-[#1C1816] border border-white/[0.06] rounded-2xl p-4 flex flex-col md:flex-row gap-4 mb-6 shadow-xl shadow-black/20">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-white/[0.08] rounded-xl bg-white/[0.02] text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c] transition-all"
            placeholder="Tìm kiếm theo mã code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={fetchVouchers}
          className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#c9a15c] mb-4" />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      ) : (
        <div className="bg-[#1C1816] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#171412] text-gray-400 text-xs uppercase border-b border-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Mã Voucher</th>
                  <th className="px-6 py-4 font-semibold">Loại giảm</th>
                  <th className="px-6 py-4 font-semibold">Giá trị</th>
                  <th className="px-6 py-4 font-semibold">Đơn tối thiểu</th>
                  <th className="px-6 py-4 font-semibold">Hạn sử dụng</th>
                  <th className="px-6 py-4 font-semibold">Đã dùng</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy mã giảm giá nào.
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((v) => (
                    <tr key={v._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#c9a15c]/10 text-[#c9a15c] font-mono font-bold tracking-widest text-xs border border-[#c9a15c]/20">
                          {v.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-semibold tracking-wider ${
                          v.discountType === 'PERCENTAGE' 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {v.discountType === 'PERCENTAGE' ? 'PHẦN TRĂM' : 'SỐ TIỀN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(v.minOrderValue)}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(v.expiryDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        {v.usedCount} / {v.usageLimit}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold tracking-wider ${
                          v.isActive && new Date(v.expiryDate) >= new Date()
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {v.isActive ? (new Date(v.expiryDate) >= new Date() ? 'HOẠT ĐỘNG' : 'HẾT HẠN') : 'ĐÃ TẮT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openForm(v)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v._id, v.code)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Xoá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA VOUCHER */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="bg-[#1C1816] rounded-2xl w-full max-w-2xl relative z-10 border border-white/[0.08] shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between shrink-0">
              <h2 className="text-xl font-serif font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c9a15c]" />
                {editingVoucher ? "Chỉnh sửa Voucher" : "Tạo Voucher mới"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.08] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
              <form onSubmit={handleSave} className="space-y-5" id="voucher-form">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Mã Code *</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c] outline-none uppercase"
                      placeholder="VD: SALE50, FREESHIP..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Loại giảm giá *</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white outline-none focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c]"
                    >
                      <option value="PERCENTAGE" className="bg-[#1C1816]">Giảm theo phần trăm (%)</option>
                      <option value="FIXED" className="bg-[#1C1816]">Giảm số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">
                      Giá trị giảm * {discountType === "PERCENTAGE" ? "(%)" : "(VNĐ)"}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c] outline-none"
                      placeholder="VD: 10 hoặc 50000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">
                      Giảm tối đa (VNĐ) <span className="text-gray-500 text-xs italic">(Không bắt buộc)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      disabled={discountType === "FIXED"}
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c] outline-none disabled:opacity-50"
                      placeholder={discountType === "FIXED" ? "Chỉ dành cho %" : "Nhập số tiền tối đa"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Đơn hàng tối thiểu (VNĐ) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white outline-none focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Lượt dùng tối đa *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white outline-none focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Ngày hết hạn *</label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white outline-none focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c]"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-center">
                    <label className="text-sm font-medium text-gray-300 mb-2">Trạng thái hoạt động</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a15c]"></div>
                      <span className="ml-3 text-sm font-medium text-gray-300">
                        {isActive ? "Bật" : "Tắt"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c] outline-none resize-none"
                    placeholder="Mô tả về điều kiện sử dụng mã giảm giá..."
                  />
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-white/[0.08] flex justify-end gap-3 shrink-0 bg-[#171412] rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-300 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-colors"
              >
                Huỷ bỏ
              </button>
              <button
                form="voucher-form"
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 text-sm font-semibold text-[#14110F] bg-[#c9a15c] hover:bg-[#b58c49] rounded-xl shadow-lg shadow-[#c9a15c]/20 disabled:opacity-70 flex items-center gap-2 transition-colors"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingVoucher ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
