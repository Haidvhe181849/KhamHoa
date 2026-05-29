"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Lock, Loader2, Check, ArrowLeft, KeyRound, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAF7F2]">
        <Loader2 className="w-10 h-10 text-[#c9a15c] animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Nhận mã Token/OTP tự động từ Query string (Nếu click từ nút của Sandbox)
  const queryToken = searchParams.get("token") || "";

  // Biểu mẫu State
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toggle hiển thị mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  // UX State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // Mật khẩu Độ mạnh State
  const [pwdStrength, setPwdStrength] = useState({ score: 0, label: "Rất Yếu", color: "bg-red-500" });

  // Gán giá trị token từ Query string khi trang được tải
  useEffect(() => {
    if (queryToken) {
      setToken(queryToken);
    }
  }, [queryToken]);

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
    let color = "bg-red-500";

    if (score >= 4) {
      label = "Mạnh";
      color = "bg-emerald-600";
    } else if (score >= 2) {
      label = "Trung bình";
      color = "bg-[#c9a15c]";
    }

    setPwdStrength({ score, label, color });
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Thực thi xác thực các trường
    if (!token.trim() || !password || !confirmPassword) {
      setErrorMsg("Vui lòng điền đầy đủ Mã khôi phục và Mật khẩu mới.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu mới phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận chưa trùng khớp với mật khẩu mới.");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(token, password);
      if (result.success) {
        setSuccess(true);
        // Chuyển hướng sang trang đăng nhập sau 1.5 giây
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setErrorMsg(result.message || "Đặt lại mật khẩu thất bại. Mã xác thực không đúng hoặc đã hết hạn.");
      }
    } catch (err) {
      setErrorMsg("Lỗi kết nối hệ thống. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-16 bg-[#FAF7F2] font-sans relative overflow-hidden">
      {/* Nền lấp lánh trang trí mờ ảo */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#eef2f6]/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#e8d8c3]/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8E3DA] p-8 md:p-10 shadow-[0_20px_50px_-20px_rgba(201,161,92,0.15)] z-10 animate-in fade-in slide-in-from-bottom-6 duration-600">
        
        {/* Quay lại login */}
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#777] hover:text-[#c9a15c] transition-colors mb-6 uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Trở lại yêu cầu gửi mã
        </Link>

        {/* Tiêu đề trang */}
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-serif text-[#2B2B2B] font-semibold">
            Đặt lại mật khẩu mới
          </h1>
          <p className="text-xs text-secondary-foreground mt-2 leading-relaxed">
            Nhập mã khôi phục gồm 6 chữ số và thiết lập mật khẩu bảo mật mới cho tài khoản của bạn.
          </p>
        </div>

        {!success ? (
          /* BIỂU MẪU ĐẶT LẠI */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Mã OTP khôi phục */}
            <div className="space-y-1.5">
              <label htmlFor="token" className="text-xs font-semibold text-[#2b2b2b] tracking-wider uppercase">
                Mã xác thực khôi phục (OTP)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="token"
                  type="text"
                  placeholder="Nhập 6 chữ số"
                  disabled={loading}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E3DA] rounded-xl text-sm font-semibold tracking-[0.05em] text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                />
              </div>
            </div>

            {/* Mật khẩu mới */}
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
                  placeholder="Tối thiểu 6 ký tự"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-white border border-[#E8E3DA] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#c9a15c] transition-colors"
                >
                  {showPassword ? <span className="text-xs font-medium">Ẩn</span> : <span className="text-xs font-medium">Hiện</span>}
                </button>
              </div>

              {/* Chỉ báo độ mạnh mật khẩu */}
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
                </div>
              )}
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-[#2b2b2b] tracking-wider uppercase">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-white border border-[#E8E3DA] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                />
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-red-500 flex items-center gap-1.5 mt-1 animate-in fade-in duration-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Mật khẩu nhập lại chưa khớp.
                </p>
              )}
            </div>

            {/* Báo lỗi */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border-l-2 border-red-500 rounded-lg text-xs text-red-600 leading-normal animate-in fade-in duration-200">
                {errorMsg}
              </div>
            )}

            {/* Nút nộp */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#c9a15c] hover:bg-[#b88f4b] disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl tracking-wider transition-all duration-300 shadow-md shadow-[#c9a15c]/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang thiết lập...
                </>
              ) : (
                "Xác Nhận Đổi Mật Khẩu"
              )}
            </button>
          </form>
        ) : (
          /* TRẠNG THÁI THÀNH CÔNG */
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-400 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600 stroke-[2.5]" />
            </div>
            <h2 className="text-lg font-serif font-bold text-gray-800">
              Đặt lại mật khẩu thành công!
            </h2>
            <p className="text-xs text-secondary-foreground leading-relaxed max-w-sm mx-auto">
              Mật khẩu mới đã được cập nhật thành công. Đang tự động chuyển hướng bạn quay lại trang đăng nhập...
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-3 bg-[#c9a15c] hover:bg-[#b88f4b] text-white text-sm font-semibold rounded-xl tracking-wider transition-all block"
              >
                Đăng Nhập Ngay
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
