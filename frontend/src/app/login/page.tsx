"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { STORY_IMAGES } from "@/lib/storyImages";
import { Eye, EyeOff, Loader2, Mail, Lock, Check } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAF7F2]">
        <Loader2 className="w-10 h-10 text-[#c9a15c] animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { login, isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Trích xuất đường dẫn redirect sau khi đăng nhập thành công
  const redirectPath = searchParams.get("redirect") || "/";

  // Biểu mẫu State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Trạng thái UX
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // Nếu người dùng đã đăng nhập sẵn thì tự động chuyển hướng
  useEffect(() => {
    if (isAuthenticated && !authLoading && user) {
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push(redirectPath);
      }
    }
  }, [isAuthenticated, authLoading, router, redirectPath, user]);

  // Xử lý xác thực đăng nhập
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation cơ bản
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ Email và Mật khẩu.");
      return;
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Định dạng địa chỉ Email không đúng.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password, rememberMe);
      if (result.success) {
        setSuccess(true);
        // Đợi 800ms để chạy hiệu ứng thành công trước khi chuyển hướng
        setTimeout(() => {
          if (result.user?.role === "admin") {
            router.push("/admin/dashboard");
          } else {
            router.push(redirectPath);
          }
          router.refresh();
        }, 800);
      } else {
        setErrorMsg(result.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (err) {
      setErrorMsg("Lỗi hệ thống. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 font-sans bg-[#FAF7F2]">
      {/* 1. Bên Trái (Desktop Split-Screen Layout): Ảnh Lifestyle thủ công cao cấp nghệ nhân */}
      <div className="hidden lg:flex lg:col-span-7 relative h-screen overflow-hidden group">
        {/* Ảnh nền Unsplash vỏ abalone xà cừ óng ánh */}
        <Image
          src={STORY_IMAGES.hero.src}
          alt={STORY_IMAGES.hero.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover transition-transform duration-10000 ease-out scale-100 group-hover:scale-105"
        />
        {/* Overlay ánh vàng xà cừ cực kỳ thượng lưu tinh tế */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1715]/90 via-[#2b2522]/40 to-[#c9a15c]/10" />

        {/* Nội dung câu chuyện thương hiệu */}
        <div className="absolute bottom-16 left-16 right-16 text-white z-10 animate-in fade-in slide-in-from-bottom-8 duration-800">
          <div className="bg-[#c9a15c] text-[10px] tracking-[0.3em] uppercase font-semibold text-white px-3 py-1 rounded-sm w-max mb-6">
            Tinh Hoa Di Sản Việt
          </div>
          <h1 className="text-4xl lg:text-5xl font-serif tracking-wide leading-tight mb-4">
            Mỗi Mảnh Xà Cừ là một<br />
            <span className="text-[#e8d8c3] italic">Tuyệt Tác Độc Bản</span>
          </h1>
          <p className="text-sm font-light text-[#e8e3da] max-w-lg leading-relaxed mb-0">
            Từ dòng chảy đại dương đến đôi bàn tay khéo léo của nghệ nhân Việt,
            mỗi lớp khảm xà cừ tại Khảm Hoa Store mang trọn sắc màu ngũ sắc lấp lánh,
            tôn vinh phong cách sống thanh lịch và đầy chất nghệ thuật của bạn.
          </p>
        </div>
      </div>

      {/* 2. Bên Phải: Login Form */}
      <div className="col-span-1 lg:col-span-5 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-12 xl:px-16 bg-gradient-to-tr from-[#fcfbf9] via-[#FAF7F2] to-[#FAF7F2] relative overflow-hidden">
        {/* Đồ họa sóng ngọc trai trang trí mờ ảo góc phải */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#eef2f6]/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[#e8d8c3]/20 blur-3xl pointer-events-none" />

        {/* Khối Form */}
        <div className="w-full max-w-md mx-auto z-10 animate-in fade-in slide-up-4 duration-600">

          {/* Logo & Slogan tiêu đề */}
          <div className="text-center lg:text-left mb-10">
            <Link href="/" className="inline-block group">
              <h2 className="text-3xl font-serif tracking-[0.15em] text-[#2e4c7e] font-bold transition-all duration-300 group-hover:text-[#c9a15c]">
                KHẢM HOA
              </h2>
              <p className="text-[9px] tracking-[0.25em] text-[#999] uppercase font-semibold mt-1">
                Tinh Hoa Nghệ Thuật Khảm Đương Đại
              </p>
            </Link>
            <h3 className="mt-8 text-xl font-serif text-[#2B2B2B] font-semibold">
              Chào mừng bạn trở lại
            </h3>
            <p className="text-xs text-secondary-foreground mt-2">
              Khám phá thế giới phụ kiện & quà tặng khảm trai tinh tế.
            </p>
          </div>

          {/* Form chính */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-[#2b2b2b] tracking-wider uppercase">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={loading || success}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E8E3DA] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-[#2b2b2b] tracking-wider uppercase">
                  Mật khẩu
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#c9a15c] hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={loading || success}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white border border-[#E8E3DA] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#c9a15c] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <label className="relative flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={loading || success}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 border border-[#E8E3DA] rounded-[4px] bg-white peer-checked:bg-[#c9a15c] peer-checked:border-[#c9a15c] transition-all flex items-center justify-center">
                  <Check className="w-3 h-3 text-white stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="ml-2.5 text-xs text-secondary-foreground select-none font-medium">
                  Ghi nhớ đăng nhập
                </span>
              </label>
            </div>

            {/* Thông báo lỗi */}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border-l-2 border-red-500 rounded-lg text-xs text-red-600 leading-normal animate-in fade-in duration-200">
                {errorMsg}
              </div>
            )}

            {/* Trạng thái thành công */}
            {success && (
              <div className="p-3.5 bg-emerald-50 border-l-2 border-emerald-500 rounded-lg text-xs text-emerald-600 flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 stroke-[3]" />
                Đăng nhập thành công! Đang chuyển hướng...
              </div>
            )}

            {/* Nút Đăng nhập */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 bg-[#c9a15c] hover:bg-[#b88f4b] disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl tracking-wider transition-all duration-300 shadow-md shadow-[#c9a15c]/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                "Đăng Nhập"
              )}
            </button>
          </form>

          {/* Liên kết đăng ký tài khoản */}
          <div className="mt-8 text-center text-xs">
            <span className="text-secondary-foreground font-medium">Bạn chưa có tài khoản? </span>
            <Link
              href={`/register?redirect=${encodeURIComponent(redirectPath)}`}
              className="text-[#c9a15c] font-semibold hover:underline ml-1"
            >
              Đăng ký miễn phí
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
