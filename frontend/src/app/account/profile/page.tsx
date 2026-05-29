"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";
import { User, Phone, MapPin, Mail, KeyRound, Loader2, Check, AlertCircle, Edit3, Camera, Lock } from "lucide-react";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-[#eef2f6] font-sans">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-32 max-w-4xl">
          <ProfileContent />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, syncProfile } = useAuth();

  // Trạng thái Chỉnh sửa Thông tin cá nhân
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Trạng thái Biểu mẫu Mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Trạng thái hoạt động & Thông báo UX
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
    setProfileError("");
  };

  // Lưu chỉnh sửa thông tin cá nhân
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);

    if (!name.trim()) {
      setProfileError("Họ và tên không được để trống.");
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
        setProfileSuccess(true);
        setIsEditing(false);
        // Đồng bộ dữ liệu mới lên AuthContext để cập nhật Navbar
        await syncProfile();
        
        setTimeout(() => {
          setProfileSuccess(false);
        }, 3000);
      } else {
        setProfileError(data.message || "Không thể cập nhật thông tin cá nhân.");
      }
    } catch (err) {
      setProfileError("Kết nối máy chủ thất bại.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Xử lý đổi mật khẩu mới
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    // Validate mật khẩu phía Client (Zod-like validation)
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Vui lòng nhập đầy đủ tất cả các trường mật khẩu.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải dài ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Mật khẩu xác nhận chưa trùng khớp với mật khẩu mới.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
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
        setPasswordSuccess(true);
        // Reset form mật khẩu
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        
        setTimeout(() => {
          setPasswordSuccess(false);
        }, 3000);
      } else {
        setPasswordError(data.message || "Thay đổi mật khẩu thất bại.");
      }
    } catch (err) {
      setPasswordError("Kết nối máy chủ thất bại.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Tải ảnh đại diện lên
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Kích thước ảnh không được vượt quá 5MB.");
      return;
    }

    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess(false);
    
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
        setProfileSuccess(true);
        await syncProfile();
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        setProfileError(data.message || "Không thể cập nhật ảnh đại diện.");
      }
    } catch (err) {
      setProfileError("Lỗi kết nối khi tải ảnh lên.");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tiêu đề Trang - Font chữ Serif Luxury */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-serif tracking-wide text-[#2b2b2b] font-semibold">
          HỒ SƠ CỦA BẠN
        </h1>
        <p className="text-xs text-secondary-foreground mt-2 uppercase tracking-[0.2em] font-medium">
          Quản lý tài khoản & Thiết lập bảo mật
        </p>
      </div>

      {/* KHỐI 1: THÔNG TIN CÁ NHÂN */}
      <section className="bg-white border border-[#e2e8f0] rounded-2xl shadow-[0_15px_40px_-20px_rgba(201,161,92,0.12)] p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Cột trái: Trình chọn ảnh đại diện Avatar */}
          <div className="w-full md:w-1/3 flex flex-col items-center shrink-0">
            <label className="relative group cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={profileLoading} />
              {/* Vòng ngoài vàng Gold xà cừ */}
              <div className="absolute inset-0 rounded-full border-2 border-[#2e4c7e] scale-105 opacity-60 group-hover:scale-110 transition-all duration-300 pointer-events-none" />
              
              {/* Khung ảnh chính */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-white shadow-md bg-[#eef2f6]">
                {previewAvatar || user?.avatar ? (
                  <img src={previewAvatar || user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#2e4c7e] font-serif font-bold text-3xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Overlay loading khi đang tải ảnh */}
                {profileLoading && (
                  <div className="absolute inset-0 bg-[#2b2b2b]/60 flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}

                {/* Overlay hover đổi ảnh (chỉ hiện khi không loading) */}
                {!profileLoading && (
                  <div className="absolute inset-0 bg-[#2b2b2b]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </label>
            
            <p className="text-xs font-semibold text-[#2e4c7e] mt-4 tracking-wider uppercase">
              Ảnh đại diện xà cừ
            </p>
            <p className="text-[10px] text-secondary-foreground text-center mt-1 max-w-[200px] leading-relaxed">
              Nhấp vào hình tròn phía trên để đăng ảnh định dạng PNG, JPG.
            </p>
          </div>

          {/* Cột phải: Form thông tin cá nhân */}
          <div className="w-full md:w-2/3">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-serif font-semibold text-[#2b2b2b]">
                Chi tiết cá nhân
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#2e4c7e] hover:text-[#1b2a4a] border border-[#e2e8f0] hover:border-[#2e4c7e] rounded-full px-4 py-2 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Tên đầy đủ */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-[#2b2b2b] tracking-wider uppercase">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      disabled={!isEditing || profileLoading}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border transition-all ${
                        isEditing 
                          ? "bg-white border-[#2e4c7e] text-[#2b2b2b] focus:ring-1 focus:ring-[#2e4c7e]" 
                          : "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>

                {/* Email (Mail - Read Only) */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-[#2b2b2b] tracking-wider uppercase">
                    Địa chỉ Email (Mail)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Sđt (Phone Number) */}
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-semibold text-[#2b2b2b] tracking-wider uppercase">
                    Số điện thoại (Sđt)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Chưa cập nhật SĐT"
                      disabled={!isEditing || profileLoading}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border transition-all ${
                        isEditing 
                          ? "bg-white border-[#2e4c7e] text-[#2b2b2b] focus:ring-1 focus:ring-[#2e4c7e]" 
                          : "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>

                {/* Địa chỉ (Shipping Address) */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-semibold text-[#2b2b2b] tracking-wider uppercase">
                    Địa chỉ nhận hàng (Địa chỉ)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 pt-3 items-start pointer-events-none text-gray-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <textarea
                      placeholder="Chưa cập nhật địa chỉ giao hàng"
                      disabled={!isEditing || profileLoading}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border transition-all resize-none ${
                        isEditing 
                          ? "bg-white border-[#2e4c7e] text-[#2b2b2b] focus:ring-1 focus:ring-[#2e4c7e]" 
                          : "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Trạng thái lỗi */}
              {profileError && (
                <div className="p-3 bg-red-50 border-l-2 border-red-500 rounded-lg text-xs text-red-600 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {profileError}
                </div>
              )}

              {/* Trạng thái thành công */}
              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border-l-2 border-emerald-500 rounded-lg text-xs text-emerald-600 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <Check className="w-4 h-4 stroke-[3] shrink-0" />
                  Cập nhật thông tin tài khoản thành công!
                </div>
              )}

              {/* Hàng nút bấm gửi lưu */}
              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 animate-in fade-in duration-300">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={profileLoading}
                    className="px-5 py-2.5 border border-[#e2e8f0] hover:border-[#2e4c7e] text-[#777] hover:text-[#2e4c7e] text-xs font-semibold rounded-full transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-2.5 bg-[#2e4c7e] hover:bg-[#c49490] disabled:bg-gray-300 text-white text-xs font-semibold rounded-full tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#2e4c7e]/15 active:scale-[0.98]"
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
      <section className="bg-white border border-[#e2e8f0] rounded-2xl shadow-[0_15px_40px_-20px_rgba(201,161,92,0.12)] p-6 md:p-8 max-w-2xl mx-auto md:mx-0">
        <h3 className="text-lg font-serif font-semibold text-[#2b2b2b] mb-2">
          Đổi mật khẩu bảo mật
        </h3>
        <p className="text-xs text-secondary-foreground mb-6 leading-relaxed">
          Đảm bảo mật khẩu của bạn có độ dài tối thiểu 6 ký tự để nâng cao bảo vệ tài khoản.
        </p>

        <form onSubmit={handleSavePassword} className="space-y-4">
          {/* Mật khẩu hiện tại */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#2b2b2b] tracking-wider uppercase">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                disabled={passwordLoading}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#2e4c7e] focus:ring-1 focus:ring-[#2e4c7e] transition-all"
              />
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#2b2b2b] tracking-wider uppercase">
              Mật khẩu mới
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                disabled={passwordLoading}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#2e4c7e] focus:ring-1 focus:ring-[#2e4c7e] transition-all"
              />
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#2b2b2b] tracking-wider uppercase">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                disabled={passwordLoading}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#2e4c7e] focus:ring-1 focus:ring-[#2e4c7e] transition-all"
              />
            </div>
          </div>

          {/* Thông báo lỗi */}
          {passwordError && (
            <div className="p-3 bg-red-50 border-l-2 border-red-500 rounded-lg text-xs text-red-600 flex items-center gap-1.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {passwordError}
            </div>
          )}

          {/* Thông báo thành công */}
          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border-l-2 border-emerald-500 rounded-lg text-xs text-emerald-600 flex items-center gap-1.5 animate-in fade-in duration-200">
              <Check className="w-4 h-4 stroke-[3] shrink-0" />
              Mật khẩu đã được thay đổi thành công!
            </div>
          )}

          {/* Nút bấm Đổi mật khẩu */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-8 py-3 bg-[#2e4c7e] hover:bg-[#c49490] disabled:bg-gray-300 text-white text-xs font-semibold rounded-full tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#2e4c7e]/15 active:scale-[0.98]"
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

