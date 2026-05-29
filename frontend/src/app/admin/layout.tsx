"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { 
  LayoutDashboard, ShoppingBag, MessageSquare, Box, FolderTree, 
  Users, LogOut, Menu, X, Bell, RotateCw, UserCheck, ShieldAlert, Ticket, Star 
} from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Sidebar responsive states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [liveTime, setLiveTime] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAvatarDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Menu items list
  const sidebarItems: SidebarItem[] = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Quản lý đơn hàng", href: "/admin/order", icon: ShoppingBag },
    { name: "Quản lý cuộc trò chuyện", href: "/admin/conversation", icon: MessageSquare },
    { name: "Quản lý sản phẩm", href: "/admin/product", icon: Box },
    { name: "Quản lý danh mục", href: "/admin/categorie", icon: FolderTree },
    { name: "Quản lý Voucher", href: "/admin/vouchers", icon: Ticket },
    { name: "Quản lý người dùng", href: "/admin/user", icon: Users },
    { name: "Nhật ký hệ thống", href: "/admin/audit-log", icon: ShieldAlert },
    { name: "Quản lý đánh giá", href: "/admin/reviews", icon: Star },
  ];

  // Dynamic live clock for header
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setLiveTime(
        date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " | " + date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?")) {
      await logout();
      router.push("/login");
    }
  };

  // Dynamic breadcrumb label
  const getActiveTitle = () => {
    const activeItem = sidebarItems.find(item => pathname.startsWith(item.href));
    return activeItem ? activeItem.name : "Quản trị viên";
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen flex bg-[#14110F] text-[#FAF8F6] font-sans antialiased selection:bg-[#c9a15c] selection:text-[#14110F]">
        
        {/* DESKTOP SIDEBAR */}
        <aside 
          className={`hidden md:flex flex-col border-r border-white/[0.06] bg-[#1C1816] shrink-0 transition-all duration-300 ${
            isSidebarOpen ? "w-64" : "w-20"
          }`}
        >
          {/* Sidebar Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/[0.06] shrink-0">
            <Link href="/admin/dashboard" className="flex items-center gap-3 select-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c9a15c] to-[#e8d8c3]/40 flex items-center justify-center shadow-lg shadow-black/50 shrink-0">
                <span className="font-serif font-black text-[#14110F] text-lg">KH</span>
              </div>
              {isSidebarOpen && (
                <div className="animate-in fade-in duration-300">
                  <h1 className="font-serif text-sm tracking-[0.2em] font-extrabold leading-none text-[#FAF8F6]">
                    KHẢM HOA
                  </h1>
                  <span className="text-[9px] tracking-widest text-[#c9a15c] font-semibold uppercase block mt-1">
                    ADMIN SUITE
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto scrollbar-thin">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 group relative ${
                    isActive 
                      ? "bg-white/[0.04] text-[#c9a15c] shadow-[inset_0_0_0_1px_rgba(201,161,92,0.15)] border-l-3 border-[#c9a15c]" 
                      : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-[#c9a15c]" : "text-gray-400 group-hover:text-white"
                  }`} />
                  {isSidebarOpen && <span className="animate-in fade-in duration-300">{item.name}</span>}
                  
                  {/* Tooltip when sidebar is collapsed */}
                  {!isSidebarOpen && (
                    <div className="absolute left-24 bg-[#1C1816] text-[#c9a15c] text-xs font-semibold px-3 py-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-white/[0.08] shadow-2xl z-50 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer (Logout) */}
          <div className="p-4 border-t border-white/[0.06] bg-[#171412] shrink-0">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-300 cursor-pointer ${
                isSidebarOpen ? "justify-start" : "justify-center"
              }`}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>Đăng xuất</span>}
            </button>
          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAWSER */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-300">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <aside className="relative flex flex-col w-72 max-w-[80vw] bg-[#1C1816] h-full border-r border-white/[0.08] p-5 shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#c9a15c] flex items-center justify-center font-serif font-black text-black">
                    KH
                  </div>
                  <div>
                    <h1 className="font-serif text-xs tracking-widest font-black text-white">KHẢM HOA</h1>
                    <span className="text-[8px] text-[#c9a15c] tracking-widest uppercase block font-bold">ADMIN PANEL</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-6 space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive 
                          ? "bg-white/[0.04] text-[#c9a15c] border-l-3 border-[#c9a15c]" 
                          : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-5 border-t border-white/[0.08]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* MAIN DISPLAY VIEWPORT */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
          
          {/* HEADER HEADER */}
          <header className="h-20 bg-[#1C1816] border-b border-white/[0.06] flex items-center justify-between px-6 md:px-8 shrink-0 z-40">
            {/* Left: Collapsed and Hamburger trigger */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                <Menu className="w-5.5 h-5.5" />
              </button>
              
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden md:flex p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                <Menu className="w-5.5 h-5.5" />
              </button>

              <div className="hidden sm:block">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#c9a15c]">
                  Trang quản trị / {getActiveTitle()}
                </span>
              </div>
            </div>

            {/* Right: Live time, notification alerts, active profile */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Realtime Live Clock */}
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] font-semibold text-gray-400 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{liveTime}</span>
              </div>

              {/* Quick Reload State */}
              <button 
                onClick={() => window.location.reload()}
                title="Tải lại trang nhanh"
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCw className="w-4.5 h-4.5" />
              </button>

              <div className="h-8 w-px bg-white/[0.08]" />

              {/* Active Admin Profile Card & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div 
                  className="flex items-center gap-3 pl-1 select-none cursor-pointer group"
                  onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-white tracking-wide group-hover:text-[#c9a15c] transition-colors">{user?.name}</p>
                    <span className="text-[9px] uppercase tracking-wider text-[#c9a15c] font-black flex items-center justify-end gap-1">
                      <UserCheck className="w-3 h-3 text-[#c9a15c]" /> Admin
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#c9a15c]/20 bg-[#FAF7F2] flex items-center justify-center shadow-lg shadow-black/20 group-hover:border-[#c9a15c] transition-colors">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif text-[#14110F] bg-[#c9a15c] font-black text-sm uppercase">
                        {user?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {isAvatarDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-[#1C1816] border border-white/[0.08] rounded-2xl shadow-2xl py-2 px-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      href="/admin/profile"
                      onClick={() => setIsAvatarDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
                    >
                      Xem và sửa hồ sơ
                    </Link>
                    <Link
                      href="/admin/profile"
                      onClick={() => setIsAvatarDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors"
                    >
                      Đổi mật khẩu
                    </Link>
                    
                    <div className="h-px bg-white/[0.06] my-1 mx-2" />
                    
                    <button
                      onClick={() => {
                        setIsAvatarDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer bg-transparent border-none"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* PAGE INNER VIEWPORT */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gradient-to-b from-[#14110F] to-[#120F0E] scrollbar-thin">
            {children}
          </main>

        </div>

      </div>
    </AdminProtectedRoute>
  );
}
