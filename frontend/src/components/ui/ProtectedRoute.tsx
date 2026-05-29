"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Chuyển hướng về login kèm theo đường dẫn hiện tại để redirect lại sau khi đăng nhập thành công
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Loading State: Hiện loader nhấp nháy ánh xà cừ thượng lưu tinh tế
  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-tr from-[#fcfbf9] via-[#FAF7F2] to-[#FAF7F2]">
        {/* Vòng tròn hiệu ứng xà cừ lấp lánh (gradient hồng-vàng-lam dịu nhẹ) */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#2e4c7e] via-[#e8d8c3] to-[#2e4c7e]/40 animate-spin duration-3000 opacity-60 blur-sm"></div>
          <div className="absolute w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-[#2e4c7e]/10">
            <Loader2 className="w-8 h-8 text-[#c9a15c] animate-spin" />
          </div>
        </div>
        
        {/* Tên thương hiệu phong cách serif cao cấp */}
        <h2 className="mt-6 text-2xl font-serif tracking-[0.2em] text-[#2b2b2b] font-semibold animate-pulse">
          KHẢM HOA
        </h2>
        <p className="mt-2 text-[10px] tracking-[0.3em] text-[#777] uppercase font-medium">
          Tinh Hoa Nghệ Thuật Khảm Đương Đại
        </p>
      </div>
    );
  }

  // Nếu đã đăng nhập thì hiển thị giao diện trang con bình thường
  return isAuthenticated ? <>{children}</> : null;
}

// Loading Component độc lập để dùng khi Boot ứng dụng
export function IridescentLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-tr from-[#fcfbf9] via-[#FAF7F2] to-[#FAF7F2]">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#2e4c7e] via-[#e8d8c3] to-[#2e4c7e]/40 animate-spin duration-3000 opacity-60 blur-sm"></div>
        <div className="absolute w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-[#2e4c7e]/10">
          <Loader2 className="w-8 h-8 text-[#c9a15c] animate-spin" />
        </div>
      </div>
      <h2 className="mt-6 text-2xl font-serif tracking-[0.2em] text-[#2b2b2b] font-semibold animate-pulse">
        KHẢM HOA
      </h2>
      <p className="mt-2 text-[10px] tracking-[0.3em] text-[#777] uppercase font-medium">
        Tinh Hoa Nghệ Thuật Khảm Đương Đại
      </p>
    </div>
  );
}
