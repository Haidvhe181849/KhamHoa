"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Loader2, Check, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ Email của bạn.");
      return;
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Địa chỉ Email không đúng định dạng hợp lệ.");
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSuccess(true);
      } else {
        setErrorMsg(result.message || "Gửi yêu cầu thất bại. Vui lòng thử lại sau.");
      }
    } catch (err) {
      setErrorMsg("Lỗi hệ thống. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-16 bg-[#FAF7F2] font-sans relative overflow-hidden">
      {/* Khối nền xà cừ mờ trang trí */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#eef2f6]/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#e8d8c3]/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8E3DA] p-8 md:p-10 shadow-[0_20px_50px_-20px_rgba(201,161,92,0.15)] z-10 animate-in fade-in slide-in-from-bottom-6 duration-600">
        
        {/* Quay lại đăng nhập */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#777] hover:text-[#c9a15c] transition-colors mb-6 uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
        </Link>

        {/* Tiêu đề & Giải thích */}
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-serif text-[#2B2B2B] font-semibold">
            Khôi phục mật khẩu
          </h1>
          <p className="text-xs text-secondary-foreground mt-2 leading-relaxed">
            Nhập địa chỉ Email liên kết với tài khoản của bạn. Chúng tôi sẽ khởi tạo và gửi mã đặt lại mật khẩu gồm 6 chữ số.
          </p>
        </div>

        {!success ? (
          /* BIỂU MẪU YÊU CẦU */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-[#2b2b2b] tracking-wider uppercase">
                Địa chỉ Email của bạn
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E3DA] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                />
              </div>
            </div>

            {/* Báo lỗi */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border-l-2 border-red-500 rounded-lg text-xs text-red-600 leading-normal animate-in fade-in duration-200">
                {errorMsg}
              </div>
            )}

            {/* Nút gửi yêu cầu */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#c9a15c] hover:bg-[#b88f4b] disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl tracking-wider transition-all duration-300 shadow-md shadow-[#c9a15c]/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang khởi tạo mã...
                </>
              ) : (
                "Gửi Mã Khôi Phục"
              )}
            </button>
          </form>
        ) : (
          /* TRẠNG THÁI THÀNH CÔNG */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-semibold text-emerald-800">Yêu cầu thành công</h3>
              <p className="text-xs text-emerald-700 leading-relaxed mt-1.5">
                Yêu cầu khôi phục đã được xử lý thành công. Mã xác thực (OTP) đã được gửi đến địa chỉ email của bạn.
              </p>
            </div>

            <p className="text-xs text-secondary-foreground text-center leading-relaxed">
              Mã xác thực đã được gửi về hòm thư điện tử cá nhân của bạn. Vui lòng kiểm tra hộp thư đến (và mục thư rác/spam).
            </p>

            {/* Chuyển tới trang đặt lại mật khẩu thủ công */}
            <div className="space-y-3 pt-2">
              <Link
                href="/reset-password"
                className="w-full py-3 bg-[#2b2b2b] hover:bg-[#1f1f1f] text-white text-sm font-semibold rounded-xl tracking-wider transition-all text-center block"
              >
                Nhập Mã Xác Thực OTP
              </Link>
              
              <button
                onClick={() => setSuccess(false)}
                className="w-full py-2.5 bg-white border border-[#E8E3DA] hover:border-[#c9a15c] text-[#777] hover:text-[#c9a15c] text-xs font-semibold rounded-xl transition-all cursor-pointer bg-transparent"
              >
                Gửi lại yêu cầu khác
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
