"use client";

import React, { useState, useEffect, Suspense } from "react";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { 
  Users, Search, ShieldCheck, ShieldAlert, Lock, Unlock, 
  RotateCw, Loader2, Sparkles, UserCheck, AlertTriangle, RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { useConfirm } from "@/components/ui/ConfirmContext";

interface UserProfileData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar: string;
  role: "customer" | "admin";
  isBlocked: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#c9a15c] animate-spin" />
      </div>
    }>
      <UsersContent />
    </Suspense>
  );
}

function UsersContent() {
  const { user: currentUser } = useAuth();

  // State Management
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const toast = useToast();
  const { confirm } = useConfirm();

  // Filters & Page states
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const fetchUsers = async (page = 1, searchStr = search, role = roleFilter) => {
    setLoading(true);
    setError("");
    try {
      let query = `page=${page}&limit=${limit}`;
      if (searchStr) query += `&search=${encodeURIComponent(searchStr)}`;
      if (role !== "ALL") query += `&role=${role.toLowerCase()}`;

      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/admin/list?${query}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setUsers(data.data || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } else {
        setError(data.message || "Không thể tải danh sách người dùng.");
      }
    } catch (err) {
      setError("Lỗi kết nối máy chủ quản lý người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, search, roleFilter);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    fetchUsers(1, search, role);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchUsers(page, search, roleFilter);
    }
  };

  // Lock user account call
  const handleBlockUser = (userId: string, name: string) => {
    confirm({
      title: "Khóa Tài Khoản",
      message: `Bạn có chắc chắn muốn KHÓA tài khoản của người dùng "${name}"? Họ sẽ không thể đăng nhập hoặc thực hiện mua hàng nữa.`,
      variant: "danger",
      confirmText: "Khóa tài khoản",
      onConfirm: async () => {
        setActionLoading(userId + "-lock");
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/users/admin/${userId}/block`, {
            method: "PUT"
          });
          const data = await res.json();

          if (res.ok && data.success) {
            toast.success(`Đã khóa tài khoản ${name}`);
            await fetchUsers(currentPage);
          } else {
            toast.error(data.message || "Lỗi khóa tài khoản.");
          }
        } catch (err) {
          toast.error("Lỗi kết nối máy chủ khóa tài khoản.");
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  // Unlock user account call
  const handleUnblockUser = (userId: string, name: string) => {
    confirm({
      title: "Mở Khóa Tài Khoản",
      message: `Bạn có chắc chắn muốn MỞ KHÓA tài khoản của người dùng "${name}"?`,
      variant: "info",
      confirmText: "Mở khóa",
      onConfirm: async () => {
        setActionLoading(userId + "-unlock");
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/users/admin/${userId}/unblock`, {
            method: "PUT"
          });
          const data = await res.json();

          if (res.ok && data.success) {
            toast.success(`Đã mở khóa tài khoản ${name}`);
            await fetchUsers(currentPage);
          } else {
            toast.error(data.message || "Lỗi mở khóa tài khoản.");
          }
        } catch (err) {
          toast.error("Lỗi kết nối máy chủ mở khóa tài khoản.");
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  // Promote/demote role call
  const handleRoleChange = (userId: string, currentRole: string, newRole: "customer" | "admin") => {
    const actionLabel = newRole === "admin" ? "nâng quyền Quản trị viên" : "hạ quyền Thành viên thường";
    confirm({
      title: "Thay đổi vai trò",
      message: `Bạn có chắc chắn muốn ${actionLabel} cho người dùng này?`,
      variant: newRole === "admin" ? "warning" : "info",
      onConfirm: async () => {
        setActionLoading(userId + "-role");
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/users/admin/${userId}/role`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole })
          });
          const data = await res.json();

          if (res.ok && data.success) {
            toast.success(`Đã cập nhật vai trò thành công`);
            await fetchUsers(currentPage);
          } else {
            toast.error(data.message || "Lỗi cập nhật vai trò người dùng.");
          }
        } catch (err) {
          toast.error("Lỗi kết nối cập nhật vai trò.");
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-white font-semibold">
            QUẢN LÝ NGƯỜI DÙNG
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-[0.2em] font-medium">
            Danh sách thành viên đăng ký mua sắm & Thiết lập quyền hạn tài khoản
          </p>
        </div>
        <button
          onClick={() => fetchUsers(currentPage)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-[#c9a15c] border border-white/[0.08] hover:border-[#c9a15c] text-gray-300 hover:text-[#14110F] text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
        >
          <RotateCw className="w-3.5 h-3.5" /> Đồng bộ danh sách
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl backdrop-blur-md">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Search Field */}
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo họ tên, email, sđt người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
            />
          </div>

          {/* Role selector filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1C1816] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all cursor-pointer font-semibold"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="CUSTOMER">Thành viên (Customer)</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => { setSearch(""); setRoleFilter("ALL"); fetchUsers(1, "", "ALL"); }}
              className="p-2.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>

        </form>
      </div>

      {/* USERS LIST DATA TABLE */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C1816] text-[#c9a15c] uppercase font-bold tracking-widest text-[9px] border-b border-white/[0.06]">
                <th className="px-5 py-4">Hội Viên</th>
                <th className="px-5 py-4">Liên Hệ</th>
                <th className="px-5 py-4">Vai Trò (Role)</th>
                <th className="px-5 py-4">Trạng Thái</th>
                <th className="px-5 py-4">Ngày Tham Gia</th>
                <th className="px-5 py-4 text-right">Khóa / Mở Khóa Tài Khoản</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] bg-[#161311]/40">
              {users.length > 0 ? (
                users.map((item) => {
                  const isSelf = currentUser?.id === item._id;
                  const isActionLoading = (action: string) => actionLoading === item._id + "-" + action;

                  return (
                    <tr key={item._id} className="hover:bg-white/[0.01] transition-colors group">
                      
                      {/* Avatar & name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#c9a15c] flex items-center justify-center font-serif text-[#14110F] font-black text-sm uppercase shrink-0 border border-white/5 shadow">
                            {item.avatar ? (
                              <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              item.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-[#c9a15c] transition-colors flex items-center gap-1.5">
                              {item.name}
                              {isSelf && (
                                <span className="text-[9px] px-2 py-0.5 bg-[#c9a15c]/15 text-[#c9a15c] rounded-md font-bold select-none border border-[#c9a15c]/10">Tôi</span>
                              )}
                            </h4>
                            <span className="text-[9px] font-mono text-gray-500 block mt-0.5 select-all">
                              UID: {item._id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact previews */}
                      <td className="px-5 py-4 font-semibold text-gray-300 space-y-1">
                        <div className="select-all">{item.email}</div>
                        {item.phone && <div className="text-gray-500 font-medium select-all">{item.phone}</div>}
                      </td>

                      {/* Role selection selectors */}
                      <td className="px-5 py-4">
                        {isSelf ? (
                          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                            Quản trị viên chính
                          </span>
                        ) : (
                          <select
                            disabled={!!actionLoading}
                            value={item.role}
                            onChange={(e) => handleRoleChange(item._id, item.role, e.target.value as "customer" | "admin")}
                            className="px-2.5 py-1.5 bg-[#14110F] border border-white/[0.08] hover:border-[#c9a15c] rounded-xl text-[10px] font-bold text-[#c9a15c] uppercase tracking-wider focus:outline-none cursor-pointer"
                          >
                            <option value="customer">Thành viên (CUSTOMER)</option>
                            <option value="admin">Quản trị viên (ADMIN)</option>
                          </select>
                        )}
                      </td>

                      {/* Block statuses */}
                      <td className="px-5 py-4">
                        {item.isBlocked ? (
                          <span className="px-2.5 py-1 text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg uppercase tracking-wider inline-flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Bị khóa
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg uppercase tracking-wider inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Đang hoạt động
                          </span>
                        )}
                      </td>

                      {/* Join Date */}
                      <td className="px-5 py-4 text-gray-500 font-medium">
                        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Block / Unlock Direct triggers */}
                      <td className="px-5 py-4 text-right">
                        {isSelf ? (
                          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded-lg select-none">Không được khóa chính mình</span>
                        ) : item.isBlocked ? (
                          <button
                            onClick={() => handleUnblockUser(item._id, item.name)}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow shadow-emerald-600/10 active:scale-[0.98]"
                          >
                            {isActionLoading("unlock") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />} Mở khóa tài khoản
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockUser(item._id, item.name)}
                            disabled={!!actionLoading}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer"
                          >
                            {isActionLoading("lock") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />} Khóa tài khoản
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500 italic">
                    {loading ? "Đang cập nhật danh sách người dùng..." : "Không tìm thấy người dùng phù hợp."}
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

    </div>
  );
}
