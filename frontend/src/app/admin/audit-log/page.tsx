"use client";

import React, { useState, useEffect, Suspense } from "react";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import { 
  ShieldAlert, Search, RotateCw, Loader2, Calendar, User, 
  Tag, Laptop, Activity, ArrowRight, RefreshCw, Layers
} from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";

interface AuditLogData {
  _id: string;
  userId: string;
  adminName: string;
  action: string;
  targetModel: 'Order' | 'Product' | 'Voucher' | 'User';
  targetId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminAuditLogPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#c9a15c] animate-spin" />
      </div>
    }>
      <AuditLogContent />
    </Suspense>
  );
}

function AuditLogContent() {
  // State Management
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const toast = useToast();

  // Filters & Page states
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [modelFilter, setModelFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  const fetchLogs = async (
    page = 1,
    searchStr = search,
    action = actionFilter,
    model = modelFilter,
    start = startDate,
    end = endDate
  ) => {
    setLoading(true);
    setError("");
    try {
      let query = `page=${page}&limit=${limit}`;
      if (searchStr) query += `&search=${encodeURIComponent(searchStr)}`;
      if (action !== "ALL") query += `&action=${action}`;
      if (model !== "ALL") query += `&targetModel=${model}`;
      if (start) query += `&startDate=${start}`;
      if (end) query += `&endDate=${end}`;

      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/admin/audit-logs?${query}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setLogs(data.data || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } else {
        setError(data.message || "Không thể tải nhật ký hệ thống.");
      }
    } catch (err) {
      setError("Lỗi kết nối máy chủ dữ liệu nhật ký.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1, search, actionFilter, modelFilter, startDate, endDate);
  };

  const handleActionFilterChange = (action: string) => {
    setActionFilter(action);
    fetchLogs(1, search, action, modelFilter, startDate, endDate);
  };

  const handleModelFilterChange = (model: string) => {
    setModelFilter(model);
    fetchLogs(1, search, actionFilter, model, startDate, endDate);
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    fetchLogs(1, search, actionFilter, modelFilter, start, end);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchLogs(page, search, actionFilter, modelFilter, startDate, endDate);
    }
  };

  // Helper to format Date string professionally
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Helper color tags for actions
  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case "CONFIRM_ORDER":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "SHIP_ORDER":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "DELIVER_ORDER":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "CANCEL_ORDER":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "CONFIRM_PAYMENT":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "BLOCK_USER":
        return "bg-amber-500/15 text-amber-500 border border-amber-500/30";
      case "UNBLOCK_USER":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "UPDATE_USER_ROLE":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  const getActionNameVi = (action: string) => {
    switch (action) {
      case "CONFIRM_ORDER": return "Duyệt Đơn Hàng";
      case "SHIP_ORDER": return "Giao Vận Chuyển";
      case "DELIVER_ORDER": return "Hoàn Tất Giao Hàng";
      case "CANCEL_ORDER": return "Hủy Đơn Hàng";
      case "CONFIRM_PAYMENT": return "Xác Nhận Tiền Về";
      case "BLOCK_USER": return "Khóa Tài Khoản";
      case "UNBLOCK_USER": return "Mở Khóa Tài Khoản";
      case "UPDATE_USER_ROLE": return "Cập Nhật Vai Trò";
      default: return action;
    }
  };

  return (
    <div className="space-y-8 p-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h2 className="text-2xl font-serif font-black tracking-wide text-[#FAF8F6]">
            NHẬT KÝ HỆ THỐNG
          </h2>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            Lưu vết và giám sát toàn bộ hoạt động nhạy cảm của các Quản trị viên
          </p>
        </div>
        <button
          onClick={() => fetchLogs(currentPage)}
          disabled={loading}
          className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1C1816] hover:bg-white/[0.04] text-[#c9a15c] border border-white/[0.08] hover:border-[#c9a15c]/30 active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Tải lại nhật ký
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-[#1C1816] border border-white/[0.06] p-6 rounded-2xl shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Keyword Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên Admin, chi tiết hoặc loại hành động..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#14110F] border border-white/[0.08] focus:border-[#c9a15c]/40 focus:ring-1 focus:ring-[#c9a15c]/40 text-sm pl-11 pr-4 py-3 rounded-xl text-white outline-none placeholder:text-gray-600 transition-all duration-300"
              />
            </div>
            
            <button
              type="submit"
              className="px-6 py-3 bg-[#c9a15c] hover:bg-[#b08b49] text-[#14110F] font-bold rounded-xl text-sm transition-all duration-300 active:scale-95 shadow-lg shadow-[#c9a15c]/10 whitespace-nowrap"
            >
              Tìm kiếm
            </button>
          </div>

          {/* Advanced Filters: Model, Action, Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/[0.04]">
            {/* Filter by Model */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Đối tượng</label>
              <select
                value={modelFilter}
                onChange={(e) => handleModelFilterChange(e.target.value)}
                className="w-full bg-[#14110F] border border-white/[0.08] focus:border-[#c9a15c]/40 text-sm px-4 py-3 rounded-xl text-white outline-none transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="ALL">Tất cả đối tượng</option>
                <option value="Order">Đơn hàng (Order)</option>
                <option value="User">Người dùng (User)</option>
                <option value="Product">Sản phẩm (Product)</option>
                <option value="Voucher">Khuyến mãi (Voucher)</option>
              </select>
            </div>

            {/* Filter by Action */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Loại hành động</label>
              <select
                value={actionFilter}
                onChange={(e) => handleActionFilterChange(e.target.value)}
                className="w-full bg-[#14110F] border border-white/[0.08] focus:border-[#c9a15c]/40 text-sm px-4 py-3 rounded-xl text-white outline-none transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="ALL">Tất cả hành động</option>
                <option value="CONFIRM_ORDER">Duyệt đơn hàng</option>
                <option value="SHIP_ORDER">Giao vận chuyển</option>
                <option value="DELIVER_ORDER">Hoàn tất giao hàng</option>
                <option value="CANCEL_ORDER">Hủy đơn hàng</option>
                <option value="CONFIRM_PAYMENT">Xác nhận tiền về</option>
                <option value="BLOCK_USER">Khóa tài khoản</option>
                <option value="UNBLOCK_USER">Mở khóa tài khoản</option>
                <option value="UPDATE_USER_ROLE">Cập nhật vai trò</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange(e.target.value, endDate)}
                className="w-full bg-[#14110F] border border-white/[0.08] focus:border-[#c9a15c]/40 text-sm px-4 py-2.5 rounded-xl text-white outline-none transition-all duration-300"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center justify-between">
                <span>Đến ngày</span>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => handleDateChange("", "")}
                    className="text-[10px] text-[#c9a15c] hover:underline"
                  >
                    Xóa lọc ngày
                  </button>
                )}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange(startDate, e.target.value)}
                className="w-full bg-[#14110F] border border-white/[0.08] focus:border-[#c9a15c]/40 text-sm px-4 py-2.5 rounded-xl text-white outline-none transition-all duration-300"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Main logs list */}
      <div className="bg-[#1C1816] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          /* SKELETON LOADING STATE */
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#c9a15c] animate-spin" />
            <p className="text-sm text-gray-400">Đang đồng bộ và hiển thị nhật ký an ninh...</p>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Lỗi Tải Nhật Ký</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-md">{error}</p>
            </div>
            <button
              onClick={() => fetchLogs(1)}
              className="px-5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-[#c9a15c]/30 text-xs font-semibold text-[#c9a15c] transition-all"
            >
              Thử lại
            </button>
          </div>
        ) : logs.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#c9a15c]/10 flex items-center justify-center border border-[#c9a15c]/20">
              <Activity className="w-6 h-6 text-[#c9a15c]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Nhật Ký Trống</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-md">
                Không tìm thấy bản ghi nhật ký hệ thống nào khớp với bộ lọc tìm kiếm hiện tại.
              </p>
            </div>
          </div>
        ) : (
          /* DATA TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#14110F] text-gray-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4.5 px-6 font-semibold">Thời Gian</th>
                  <th className="py-4.5 px-6 font-semibold">Admin Thao Tác</th>
                  <th className="py-4.5 px-6 font-semibold">Loại Hành Động</th>
                  <th className="py-4.5 px-6 font-semibold">Đối Tượng Tác Động</th>
                  <th className="py-4.5 px-6 font-semibold">Chi Tiết Nhật Ký</th>
                  <th className="py-4.5 px-6 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-sm text-gray-300">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.01] transition-all duration-150">
                    {/* Timestamp */}
                    <td className="py-4.5 px-6 font-medium whitespace-nowrap text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </td>

                    {/* Admin Name */}
                    <td className="py-4.5 px-6 whitespace-nowrap font-semibold text-[#FAF8F6]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.08]">
                          <User className="w-3.5 h-3.5 text-[#c9a15c]" />
                        </div>
                        <span>{log.adminName}</span>
                      </div>
                    </td>

                    {/* Action Pill */}
                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getActionBadgeClass(log.action)}`}>
                        {getActionNameVi(log.action)}
                      </span>
                    </td>

                    {/* Target Model & Id */}
                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.05]">
                          {log.targetModel}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-600" />
                        <span className="font-mono text-xs text-gray-500" title={log.targetId}>
                          {log.targetId.substring(log.targetId.length - 8)}
                        </span>
                      </div>
                    </td>

                    {/* Log details */}
                    <td className="py-4.5 px-6 max-w-xs md:max-w-md lg:max-w-lg truncate font-medium text-gray-200">
                      <span title={log.details}>{log.details}</span>
                    </td>

                    {/* IP Address */}
                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-gray-400 bg-white/[0.03] px-2 py-1 rounded border border-white/[0.06] w-max">
                        <Laptop className="w-3.5 h-3.5 text-gray-500" />
                        <span>{log.ipAddress || "N/A"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION PANEL */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-5 border-t border-white/[0.06] bg-[#171412] flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              Trang <strong className="text-white font-bold">{currentPage}</strong> trên tổng số <strong className="text-white font-bold">{totalPages}</strong> trang
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#14110F] text-gray-400 border border-white/[0.06] hover:bg-white/[0.02] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-[#14110F]"
              >
                Trở lại
              </button>
              
              {/* Simple page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const showDots = idx > 0 && arr[idx - 1] !== p - 1;
                  return (
                    <React.Fragment key={p}>
                      {showDots && <span className="text-gray-600 px-1 select-none">...</span>}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentPage === p
                            ? "bg-[#c9a15c] text-[#14110F]"
                            : "bg-[#14110F] text-gray-400 border border-white/[0.06] hover:bg-white/[0.02] hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#14110F] text-gray-400 border border-white/[0.06] hover:bg-white/[0.02] hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-[#14110F]"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
