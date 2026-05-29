"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";
import { User, Phone, MapPin, Mail, KeyRound, Loader2, Check, AlertCircle, Edit3, Camera, Lock, Shield } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";

export default function AdminProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Tiêu đề Trang */}
      <div>
        <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-white font-semibold flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#c9a15c]" />
          HỒ SƠ QUẢN TRỊ VIÊN
        </h2>
        <p className="text-xs text-gray-400 mt-2 uppercase tracking-[0.2em] font-medium">
          Quản lý tài khoản & Thiết lập bảo mật hệ thống
        </p>
      </div>

      <AdminProfileContent />
    </div>
  );
}

function AdminProfileContent() {
  const { user, syncProfile } = useAuth();
  const toast = useToast();

  // Trạng thái Chỉnh sửa Thông tin cá nhân
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Trạng thái Biểu mẫu Mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Trạng thái hoạt động
  const [profileLoading, setProfileLoading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Khởi tạo giá trị ban đầu từ AuthContext
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  // Hủy chỉnh sửa thông tin cá nhân
  const handleCancelEdit = () => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
    setIsEditing(false);
  };

  // Lưu chỉnh sửa thông tin cá nhân
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Họ và tên không được để trống.");
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Cập nhật thông tin tài khoản thành công!");
        setIsEditing(false);
        // Đồng bộ dữ liệu mới lên AuthContext để cập nhật Navbar
        await syncProfile();
      } else {
        toast.error(data.message || "Không thể cập nhật thông tin cá nhân.");
      }
    } catch (err) {
      toast.error("Kết nối máy chủ thất bại.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Xử lý đổi mật khẩu mới
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Vui lòng nhập đầy đủ tất cả các trường mật khẩu.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải dài ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Mật khẩu xác nhận chưa trùng khớp với mật khẩu mới.");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/me/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Mật khẩu đã được thay đổi thành công!");
        // Reset form mật khẩu
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        toast.error(data.message || "Thay đổi mật khẩu thất bại.");
      }
    } catch (err) {
      toast.error("Kết nối máy chủ thất bại.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Tải ảnh đại diện lên
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB.");
      return;
    }

    setProfileLoading(true);
    
    // Hiển thị ảnh xem trước ngay lập tức
    const objectUrl = URL.createObjectURL(file);
    setPreviewAvatar(objectUrl);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/me/avatar`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Đã cập nhật ảnh đại diện.");
        await syncProfile();
      } else {
        toast.error(data.message || "Không thể cập nhật ảnh đại diện.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối khi tải ảnh lên.");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* KHỐI 1: THÔNG TIN CÁ NHÂN */}
      <section className="bg-[#1C1816] border border-white/[0.06] rounded-2xl shadow-xl shadow-black/20 p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Cột trái: Trình chọn ảnh đại diện Avatar */}
          <div className="w-full md:w-1/3 flex flex-col items-center shrink-0">
            <label className="relative group cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={profileLoading} />
              
              {/* Vòng ngoài vàng Gold xà cừ */}
              <div className="absolute inset-0 rounded-full border border-[#c9a15c]/40 scale-105 opacity-60 group-hover:scale-110 transition-all duration-300 pointer-events-none" />
              
              {/* Khung ảnh chính */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden border border-[#c9a15c]/20 shadow-md bg-[#14110F]">
                {previewAvatar || user?.avatar ? (
                  <img src={previewAvatar || user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#c9a15c] font-serif font-bold text-3xl uppercase">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                
                {/* Overlay loading khi đang tải ảnh */}
                {profileLoading && (
                  <div className="absolute inset-0 bg-[#14110F]/60 flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-[#c9a15c] animate-spin" />
                  </div>
                )}

                {/* Overlay hover đổi ảnh (chỉ hiện khi không loading) */}
                {!profileLoading && (
                  <div className="absolute inset-0 bg-[#14110F]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </label>
            
            <p className="text-xs font-semibold text-[#c9a15c] mt-4 tracking-wider uppercase">
              Ảnh đại diện
            </p>
            <p className="text-[10px] text-gray-500 text-center mt-1 max-w-[200px] leading-relaxed">
              Nhấp vào hình tròn phía trên để tải ảnh mới. Tối đa 5MB.
            </p>
          </div>

          {/* Cột phải: Form thông tin cá nhân */}
          <div className="w-full md:w-2/3">
            <div className="flex justify-between items-center mb-6 border-b border-white/[0.06] pb-4">
              <h3 className="text-lg font-serif font-semibold text-white">
                Chi tiết cá nhân
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#c9a15c] hover:text-[#e8d8c3] border border-white/[0.08] hover:border-[#c9a15c] bg-white/[0.02] rounded-full px-4 py-2 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Tên đầy đủ */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      disabled={!isEditing || profileLoading}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all outline-none ${
                        isEditing 
                          ? "bg-white/[0.02] border border-white/[0.08] text-white focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c]" 
                          : "bg-white/[0.01] border border-white/[0.04] text-gray-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>

                {/* Email (Mail - Read Only) */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none bg-white/[0.01] border border-white/[0.04] text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Sđt (Phone Number) */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Chưa cập nhật SĐT"
                      disabled={!isEditing || profileLoading}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all outline-none ${
                        isEditing 
                          ? "bg-white/[0.02] border border-white/[0.08] text-white focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c]" 
                          : "bg-white/[0.01] border border-white/[0.04] text-gray-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>

                {/* Địa chỉ (Shipping Address) */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
                    Địa chỉ liên hệ
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 pt-3.5 items-start pointer-events-none text-gray-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <textarea
                      placeholder="Chưa cập nhật địa chỉ"
                      disabled={!isEditing || profileLoading}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all outline-none resize-none ${
                        isEditing 
                          ? "bg-white/[0.02] border border-white/[0.08] text-white focus:ring-1 focus:ring-[#c9a15c] focus:border-[#c9a15c]" 
                          : "bg-white/[0.01] border border-white/[0.04] text-gray-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Hàng nút bấm gửi lưu */}
              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06] animate-in fade-in duration-300">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={profileLoading}
                    className="px-5 py-2.5 border border-white/[0.08] hover:bg-white/[0.04] text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-2.5 bg-[#c9a15c] hover:bg-[#b58c49] disabled:opacity-70 text-[#14110F] text-xs font-semibold rounded-xl tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#c9a15c]/20"
                  >
                    {profileLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* KHỐI 2: ĐỔI MẬT KHẨU */}
      <section className="bg-[#1C1816] border border-white/[0.06] rounded-2xl shadow-xl shadow-black/20 p-6 md:p-8 max-w-2xl">
        <h3 className="text-lg font-serif font-semibold text-white mb-2 border-b border-white/[0.06] pb-4">
          Thiết lập bảo mật
        </h3>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed mt-4">
          Đảm bảo mật khẩu của bạn có độ dài tối thiểu 6 ký tự để tăng cường bảo vệ quyền truy cập quản trị.
        </p>

        <form onSubmit={handleSavePassword} className="space-y-5">
          {/* Mật khẩu hiện tại */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                disabled={passwordLoading}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
              />
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
              Mật khẩu mới
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                disabled={passwordLoading}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
              />
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                disabled={passwordLoading}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
              />
            </div>
          </div>

          {/* Nút bấm Đổi mật khẩu */}
          <div className="flex justify-end pt-4 border-t border-white/[0.06]">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-8 py-3 bg-[#c9a15c] hover:bg-[#b58c49] disabled:opacity-70 text-[#14110F] text-xs font-semibold rounded-xl tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#c9a15c]/20"
            >
              {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Xác Nhận Đổi Mật Khẩu
            </button>
          </div>
        </form>
      </section>

    </div>
  );
}
