"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login with redirect path
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (user?.role !== "admin") {
        // Not an admin, redirect to customer home page
        router.push("/");
      }
    }
  }, [isAuthenticated, user, loading, pathname, router]);

  // Loading State: High-End Obsidian Lacquer Dark & Sand Gold Spinner
  if (loading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#14110F]">
        {/* Iridescent dark lacquer spinner frame */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#c9a15c] via-[#1C1816] to-[#c9a15c]/40 animate-spin duration-3000 opacity-60 blur-sm"></div>
          <div className="absolute w-20 h-20 rounded-full bg-[#1C1816] border border-[#c9a15c]/10 flex items-center justify-center shadow-2xl shadow-black/80">
            <Loader2 className="w-8 h-8 text-[#c9a15c] animate-spin" />
          </div>
        </div>
        
        {/* Brand serif typography in premium dark gold */}
        <h2 className="mt-6 text-2xl font-serif tracking-[0.25em] text-[#FAF8F6] font-semibold animate-pulse">
          KHẢM HOA <span className="text-xs tracking-normal font-sans text-[#c9a15c] block text-center mt-1 uppercase font-bold">ADMIN PANEL</span>
        </h2>
        <p className="mt-3 text-[9px] tracking-[0.3em] text-[#777] uppercase font-semibold">
          Tinh Hoa Nghệ Thuật Khảm Đương Đại
        </p>
      </div>
    );
  }

  // If authenticated and is admin, render children securely
  return <>{children}</>;
}
