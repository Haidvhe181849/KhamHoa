"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Check, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAF7F2]">
        <Loader2 className="w-10 h-10 text-[#c9a15c] animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectPath = searchParams.get("redirect") || "/";

  // Biểu mẫu State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toggle hiển thị mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UX State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // Mật khẩu Độ mạnh State
  const [pwdStrength, setPwdStrength] = useState({ score: 0, label: "Rất Yếu", color: "bg-red-500" });

  // Tự động chuyển hướng nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, authLoading, router, redirectPath]);

  // Đánh giá độ mạnh mật khẩu theo thời gian thực (Real-time Validation)
  useEffect(() => {
    if (!password) {
      setPwdStrength({ score: 0, label: "Chưa Nhập", color: "bg-gray-200" });
      return;
    }

    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label = "Rất Yếu";
    let color = "bg-red-500"; // Red (Yếu)

    if (score >= 4) {
      label = "Mạnh (Forest Green)";
      color = "bg-emerald-600"; // Green (Mạnh)
    } else if (score >= 2) {
      label = "Trung bình (Gold)";
      color = "bg-[#c9a15c]"; // Gold (Trung bình)
    }

    setPwdStrength({ score, label, color });
  }, [password]);

  // Xử lý nộp biểu mẫu đăng ký
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Thực thi các bước Validate thông tin biểu mẫu
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg("Vui lòng điền đầy đủ các trường thông tin bắt buộc.");
      return;
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Địa chỉ Email không đúng định dạng hợp lệ.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp với mật khẩu mới.");
      return;
    }

    setLoading(true);

    try {
      const result = await register(name, email, password);
      if (result.success) {
        setSuccess(true);
        // Hiệu ứng thành công kéo dài 800ms
        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 800);
      } else {
        setErrorMsg(result.message || "Đăng ký tài khoản thất bại. Email có thể đã được sử dụng.");
      }
    } catch (err) {
      setErrorMsg("Lỗi hệ thống. Vui lòng thử lại sau ít phút.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-16 bg-[#FAF7F2] font-sans relative overflow-hidden">
      {/* Nền xà cừ lấp lánh trang trí mờ ảo */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#eef2f6]/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#e8d8c3]/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E3DA] p-8 md:p-10 shadow-[0_20px_50px_-20px_rgba(201,161,92,0.15)] z-10 animate-in fade-in slide-in-from-bottom-6 duration-600">
        
        {/* Tiêu đề trang */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <h2 className="text-2xl md:text-3xl font-serif tracking-[0.15em] text-[#2e4c7e] font-bold transition-all duration-300 group-hover:text-[#c9a15c]">
              KHẢM HOA
            </h2>
            <p className="text-[9px] tracking-[0.25em] text-[#999] uppercase font-semibold mt-1">
              Tinh Hoa Nghệ Thuật Khảm Đương Đại
            </p>
          </Link>
          <h1 className="text-lg md:text-xl font-serif text-[#2B2B2B] font-semibold mt-6">
            Đăng ký tài khoản mới
          </h1>
          <p className="text-xs text-secondary-foreground mt-1.5">
            Tham gia cộng đồng sưu tầm mỹ nghệ khảm xà cừ thượng lưu
          </p>
        </div>

        {/* Biểu mẫu đăng ký */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Tên đầy đủ */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-[#2b2b2b] tracking-wider uppercase">
              Họ và tên
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="name"
                type="text"
                placeholder="Nguyễn Văn A"
                disabled={loading || success}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E3DA] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
              />
            </div>
          </div>

          {/* Email */}
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
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E3DA] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-[#2b2b2b] tracking-wider uppercase">
              Mật khẩu mới
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu tối thiểu 6 ký tự"
                disabled={loading || success}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-white border border-[#E8E3DA] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#c9a15c] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Chỉ báo độ mạnh mật khẩu (Password Strength Indicator) */}
            {password && (
              <div className="space-y-1 mt-1 animate-in fade-in duration-300">
                <div className="flex justify-between items-center text-[10px] font-medium text-gray-500">
                  <span>Độ mạnh mật khẩu:</span>
                  <span className="font-semibold text-[#2b2b2b]">{pwdStrength.label}</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${pwdStrength.color} transition-all duration-500`}
                    style={{ width: `${(pwdStrength.score / 5) * 100}%` }}
                  />
                </div>
                {pwdStrength.score < 4 && (
                  <p className="text-[10px] text-[#777] italic leading-tight">
                    * Mẹo: Thêm chữ hoa, số và ký tự đặc biệt để mật khẩu được bảo vệ tốt hơn.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-semibold text-[#2b2b2b] tracking-wider uppercase">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                disabled={loading || success}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-white border border-[#E8E3DA] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#c9a15c] transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-[10px] text-red-500 flex items-center gap-1.5 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Mật khẩu nhập lại chưa trùng khớp.
              </p>
            )}
          </div>

          {/* Điều khoản sử dụng dịch vụ */}
          <div className="pt-2 text-[11px] text-secondary-foreground leading-relaxed">
            Bằng việc nhấn Đăng Ký, bạn đồng ý với các{" "}
            <span className="text-[#c9a15c] hover:underline cursor-pointer">Điều khoản dịch vụ</span> và{" "}
            <span className="text-[#c9a15c] hover:underline cursor-pointer">Chính sách bảo mật</span> của Khảm Hoa Store.
          </div>

          {/* Hiển thị lỗi */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border-l-2 border-red-500 rounded-lg text-xs text-red-600 leading-normal animate-in fade-in duration-200">
              {errorMsg}
            </div>
          )}

          {/* Đăng ký thành công */}
          {success && (
            <div className="p-3 bg-emerald-50 border-l-2 border-emerald-500 rounded-lg text-xs text-emerald-600 flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 stroke-[3]" />
              Đăng ký tài khoản thành công! Đang chuyển hướng đăng nhập...
            </div>
          )}

          {/* Nút Đăng ký */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-[#c9a15c] hover:bg-[#b88f4b] disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl tracking-wider transition-all duration-300 shadow-md shadow-[#c9a15c]/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              "Đăng Ký Tài Khoản"
            )}
          </button>
        </form>

        {/* Liên kết quay lại Login */}
        <div className="mt-8 text-center text-xs border-t border-[#E8E3DA] pt-6">
          <span className="text-secondary-foreground font-medium">Bạn đã có tài khoản sẵn? </span>
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
            className="text-[#c9a15c] font-semibold hover:underline ml-1"
          >
            Đăng nhập ngay
          </Link>
        </div>

      </div>
    </div>
  );
}
