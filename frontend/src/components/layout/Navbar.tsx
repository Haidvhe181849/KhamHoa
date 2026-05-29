"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, User, Phone, MapPin, ChevronDown, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/CartContext";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/ToastContext";

export interface NavCategory {
  _id: string;
  name: string;
  slug: string;
  displayOrder?: number;
  showInMenu?: boolean;
}


const ITEMS_PER_COLUMN = 4;

function sortCategories(categories: NavCategory[]): NavCategory[] {
  return [...categories]
    .filter((c) => c.showInMenu !== false)
    .sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
        a.name.localeCompare(b.name, "vi")
    );
}

/** Chia danh mục thành các cột, mỗi cột tối đa 4 mục */
function chunkCategories(categories: NavCategory[]): NavCategory[][] {
  const chunks: NavCategory[][] = [];
  for (let i = 0; i < categories.length; i += ITEMS_PER_COLUMN) {
    chunks.push(categories.slice(i, i + ITEMS_PER_COLUMN));
  }
  return chunks;
}

export function Navbar() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [menuCategories, setMenuCategories] = useState<NavCategory[]>(
    sortCategories([])
  );
  const { cartCount } = useCart();
  const toast = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/san-pham?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setMenuCategories(sortCategories(data.data as NavCategory[]));
        }
      })
      .catch((err) => console.error("Error fetching menu categories:", err));
  }, []);

  const navLinks = [
    { label: "Trang Chủ", href: "/" },
    { label: "Sản Phẩm", href: "/san-pham", hasMega: true },
    { label: "Về Chúng Tôi", href: "/gioi-thieu" },
  ];

  const categoryColumns = chunkCategories(menuCategories);

  const productDropdown = (
    <div className="py-2">
      <Link
        href="/san-pham"
        className="block px-4 py-2.5 text-sm font-semibold text-[#2e4c7e] hover:bg-[#eef2f6]/60 rounded-lg transition-colors border-b border-[#e2e8f0] mb-3 mx-1"
      >
        Tất cả sản phẩm
      </Link>
      {categoryColumns.length > 0 ? (
        <div className="flex gap-6 px-3 pb-1">
          {categoryColumns.map((column, colIndex) => (
            <ul key={colIndex} className="min-w-[148px] space-y-0.5">
              {column.map((cat) => (
                <li key={cat._id}>
                  <Link
                    href={`/danh-muc/${cat.slug}`}
                    className="block px-2 py-2 text-sm text-[#555] hover:text-[#2e4c7e] hover:bg-[#eef2f6]/50 rounded-lg hover:pl-1 transition-all duration-200"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      ) : (
        <p className="px-4 py-3 text-xs text-[#aaa] italic">Chưa có danh mục</p>
      )}
    </div>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "shadow-lg" : ""}`}
    >
      <div className="bg-gradient-to-r from-[#1b2a4a] to-[#2e4c7e] text-white text-xs py-2.5">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="hidden md:flex items-center gap-6">
            <span className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
              <Phone className="w-3 h-3" /> 0965491328
            </span>
          </div>
          <div className="text-center flex-1 md:flex-none font-medium tracking-wider animate-pulse">
            ✨ MIỄN PHÍ VẬN CHUYỂN CHO MỌI ĐƠN HÀNG✨
          </div>
          <div className="hidden md:block text-xs">
            {authLoading ? (
              <div className="w-24 h-4 bg-white/20 rounded animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="opacity-90">Xin chào, <span className="font-semibold">{user?.name}</span></span>
                <span className="mx-2 opacity-50">|</span>
                <button
                  onClick={handleLogout}
                  className="hover:underline opacity-90 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none text-white text-xs font-normal p-0"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="hover:opacity-80 transition-opacity cursor-pointer">
                  Đăng nhập
                </Link>
                <span className="mx-2">|</span>
                <Link href="/register" className="hover:opacity-80 transition-opacity cursor-pointer">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-500 ${isScrolled ? "bg-white/95 backdrop-blur-md" : "bg-white"}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-24 relative">
            <Link href="/" className="flex items-center gap-2 sm:gap-4 shrink-0 group py-2 relative z-10">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-[#2e4c7e]/20 transition-transform duration-500 group-hover:rotate-[360deg] shadow-md shadow-[#2e4c7e]/10 bg-white">
                <Image src="/images/logoKhamHoa.png" alt="Khảm Hoa Logo" fill className="object-cover scale-[1.75]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl md:text-3xl font-serif tracking-[0.08em] sm:tracking-[0.12em] text-[#2e4c7e] font-bold leading-none mb-1">
                  KHẢM HOA
                </span>
                <span className="hidden sm:block text-[9px] tracking-[0.25em] text-[#999] uppercase font-medium">
                  Tinh Hoa NGHỆ THUẬT KHẢM ĐƯƠNG ĐẠI
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2" onMouseLeave={() => setActiveMega(null)}>
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() =>
                    link.hasMega ? setActiveMega(link.label) : setActiveMega(null)
                  }
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#333] hover:text-[#2e4c7e] transition-colors duration-300 relative group"
                  >
                    {link.label}
                    {link.hasMega && (
                      <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
                    )}
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#2e4c7e] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </Link>

                  {link.hasMega && activeMega === link.label && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-max max-w-[90vw] bg-white shadow-2xl rounded-b-2xl border-t-2 border-[#2e4c7e] p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      {productDropdown}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-3 md:gap-4 relative z-10">
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#eef2f6] text-[#333] hover:text-[#2e4c7e] transition-all duration-300"
                  aria-label="Tìm kiếm"
                >
                  <Search className="w-[18px] h-[18px]" />
                </button>
                {isSearchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#e2e8f0] rounded-2xl shadow-[0_20px_50px_-15px_rgba(46,76,126,0.15)] py-2 px-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="Nhập tên sản phẩm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full text-sm outline-none px-2 py-1"
                      />
                      <button type="submit" className="text-[#2e4c7e] hover:bg-[#eef2f6] p-1.5 rounded-full transition-colors">
                        <Search className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
              <Link
                href={isAuthenticated ? "/gio-hang" : "/login"}
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    toast.error("Vui lòng đăng nhập để xem giỏ hàng.");
                    setTimeout(() => window.location.href = "/login", 1000);
                  }
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#eef2f6] text-[#333] hover:text-[#2e4c7e] transition-all duration-300 relative"
                aria-label="Giỏ hàng"
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#2e4c7e] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>
              {/* Nút Tài khoản hoặc Shimmer Loading / Dropdown */}
              {authLoading ? (
                <div className="hidden md:block w-9 h-9 rounded-full bg-gray-100 animate-pulse border border-gray-200" />
              ) : isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="hidden md:flex w-9 h-9 rounded-full items-center justify-center hover:bg-[#eef2f6] text-[#333] hover:text-[#2e4c7e] transition-all duration-300 overflow-hidden border border-[#2e4c7e]/20 shadow-sm"
                    aria-label="Tài khoản"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-[18px] h-[18px]" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-[#e2e8f0] rounded-2xl shadow-[0_20px_50px_-15px_rgba(46,76,126,0.15)] py-2 px-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">

                      <Link
                        href="/account/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm font-semibold text-[#2e4c7e] hover:bg-[#eef2f6] rounded-xl transition-colors"
                      >
                        Hồ sơ cá nhân
                      </Link>

                      <Link
                        href="/account/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm font-semibold text-[#2e4c7e] hover:bg-[#eef2f6] rounded-xl transition-colors"
                      >
                        Lịch sử đơn hàng
                      </Link>

                      <div className="h-px bg-[#e2e8f0] my-1 mx-2" />

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer bg-transparent border-none"
                      >
                        Đăng xuất
                      </button>

                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:flex w-9 h-9 rounded-full items-center justify-center hover:bg-[#eef2f6] text-[#333] hover:text-[#2e4c7e] transition-all duration-300"
                  aria-label="Tài khoản"
                >
                  <User className="w-[18px] h-[18px]" />
                </Link>
              )}
              <button
                className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#eef2f6] text-[#333] transition-all"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t shadow-xl animate-in slide-in-from-top-2 duration-300 max-h-[70vh] overflow-y-auto">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href}
                  className="block py-3 px-4 text-sm font-medium text-[#333] hover:bg-[#eef2f6] hover:text-[#2e4c7e] rounded-xl transition-all"
                  onClick={() => !link.hasMega && setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
                {link.hasMega && (
                  <div className="pl-4 pb-3 border-l-2 border-[#e2e8f0] ml-4 mb-2">
                    <Link
                      href="/san-pham"
                      className="block py-2 text-sm font-semibold text-[#2e4c7e]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Tất cả sản phẩm
                    </Link>
                    {menuCategories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/danh-muc/${cat.slug}`}
                        className="block py-2 text-sm text-[#555] hover:text-[#2e4c7e]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* Account section for mobile */}
            <div className="pt-4 mt-4 border-t border-[#e2e8f0]">
              {authLoading ? (
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ) : isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-2 bg-[#faf8f6] rounded-xl border border-[#2e4c7e]/10">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2e4c7e]/20 bg-white shrink-0">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#2e4c7e]/5 text-[#2e4c7e] font-semibold text-sm">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#333]">{user?.name}</span>
                      <span className="text-[10px] text-[#777]">{user?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</span>
                    </div>
                  </div>
                  <Link
                    href="/account/profile"
                    className="block py-2.5 px-4 text-sm font-semibold text-[#2e4c7e] hover:bg-[#eef2f6] rounded-xl transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block py-2.5 px-4 text-sm font-semibold text-[#2e4c7e] hover:bg-[#eef2f6] rounded-xl transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Lịch sử đơn hàng
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left py-2.5 px-4 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all bg-transparent border-none cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 px-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center py-3 bg-[#2e4c7e] text-white text-xs font-bold tracking-wider uppercase rounded-xl shadow-md transition-all text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center py-3 border-2 border-[#2e4c7e] text-[#2e4c7e] hover:bg-[#eef2f6]/30 text-xs font-bold tracking-wider uppercase rounded-xl transition-all text-center bg-transparent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
