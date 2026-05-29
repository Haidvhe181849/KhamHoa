"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { mapProductFromApi, sortToApiParam, type ProductListItem } from "@/lib/products";
import { MENU_GROUP_LABELS, MENU_GROUP_ORDER, type MenuGroup } from "@/lib/menuGroups";
import { resolveCategoryMenuGroup } from "@/lib/categoryMenu";

interface CategoryFilter {
  _id: string;
  name: string;
  slug: string;
  menuGroup?: MenuGroup;
}

const PAGE_SIZE = 12;

function ProductsContent() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<CategoryFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("best-seller");
  const [activeMenuGroup, setActiveMenuGroup] = useState<MenuGroup | "ALL">("ALL");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const searchKeyword = searchParams.get("search") || "";
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const categoriesWithGroup = useMemo(
    () =>
      categories.map((c) => ({
        ...c,
        resolvedMenuGroup: resolveCategoryMenuGroup(c),
      })),
    [categories]
  );

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCategories(data.data);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort: sortToApiParam(sortOption),
    });

    if (searchKeyword) {
      params.set("search", searchKeyword);
    }

    if (activeCategoryId !== "ALL") {
      params.set("categoryId", activeCategoryId);
    } else if (activeMenuGroup !== "ALL") {
      const idsInGroup = categoriesWithGroup
        .filter((c) => c.resolvedMenuGroup === activeMenuGroup)
        .map((c) => c._id);

      if (idsInGroup.length > 0) {
        params.set("categoryIds", idsInGroup.join(","));
      } else {
        params.set("menuGroup", activeMenuGroup);
      }
    }

    fetch(`${API_BASE_URL}/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProducts(data.data.map(mapProductFromApi));
          setTotalPages(data.totalPages || 1);
          setTotal(data.total ?? data.data.length);
        } else {
          setProducts([]);
          setTotalPages(1);
          setTotal(0);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProducts([]);
        setLoading(false);
      });
  }, [page, sortOption, activeMenuGroup, activeCategoryId, categoriesWithGroup, searchKeyword]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleMenuGroupChange = (group: MenuGroup | "ALL") => {
    setActiveMenuGroup(group);
    setActiveCategoryId("ALL");
    setPage(1);
  };

  const handleCategoryChange = (categoryId: string | "ALL") => {
    setActiveCategoryId(categoryId);
    setPage(1);
  };

  const visibleCategories =
    activeMenuGroup === "ALL"
      ? categoriesWithGroup
      : categoriesWithGroup.filter((c) => c.resolvedMenuGroup === activeMenuGroup);

  const resultLabel =
    activeCategoryId !== "ALL"
      ? categoriesWithGroup.find((c) => c._id === activeCategoryId)?.name
      : activeMenuGroup !== "ALL"
        ? MENU_GROUP_LABELS[activeMenuGroup]
        : null;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white pt-24">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-[#e2e8f0] bg-white py-4">
          <div className="container mx-auto px-4">
            <div className="text-[11px] uppercase tracking-wider text-[#999] mb-3 flex gap-2">
              <Link href="/" className="hover:text-[#2e4c7e] transition-colors">
                Trang chủ
              </Link>
              <span>/</span>
              <span className="text-[#2e4c7e] font-semibold">Sản phẩm</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleMenuGroupChange("ALL")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeMenuGroup === "ALL"
                    ? "bg-[#2e4c7e] text-white shadow-md shadow-[#2e4c7e]/25"
                    : "bg-[#faf8f6] text-[#555] border border-[#e8d8c3]/60 hover:border-[#2e4c7e]/50"
                }`}
              >
                Tất cả
              </button>
              {MENU_GROUP_ORDER.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => handleMenuGroupChange(group)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    activeMenuGroup === group
                      ? "bg-[#2e4c7e] text-white shadow-md shadow-[#2e4c7e]/25"
                      : "bg-[#faf8f6] text-[#555] border border-[#e8d8c3]/60 hover:border-[#2e4c7e]/50"
                  }`}
                >
                  {MENU_GROUP_LABELS[group]}
                </button>
              ))}
            </div>

            {visibleCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#e2e8f0]/80">
                <button
                  type="button"
                  onClick={() => handleCategoryChange("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeCategoryId === "ALL"
                      ? "bg-[#333] text-white"
                      : "bg-[#faf8f6] text-[#666] border border-[#eee] hover:text-[#2e4c7e]"
                  }`}
                >
                  {activeMenuGroup === "ALL" ? "Mọi danh mục" : `Tất cả ${MENU_GROUP_LABELS[activeMenuGroup]}`}
                </button>
                {visibleCategories.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => handleCategoryChange(cat._id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      activeCategoryId === cat._id
                        ? "bg-[#333] text-white"
                        : "bg-[#faf8f6] text-[#666] border border-[#eee] hover:text-[#2e4c7e]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-b border-[#e2e8f0] bg-[#faf8f6]/40 py-3 sticky top-24 z-30">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs text-[#777] font-medium">
              <span className="text-[#333] font-bold">{total}</span> sản phẩm
              {resultLabel && (
                <span className="text-[#2e4c7e]"> · {resultLabel}</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#2e4c7e]" />
              <span className="text-xs text-[#777]">Sắp xếp:</span>
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPage(1);
                }}
                className="text-xs text-[#333] font-semibold border-none focus:ring-0 bg-transparent cursor-pointer hover:text-[#2e4c7e] transition-colors"
              >
                <option value="best-seller">Bán chạy nhất</option>
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
              </select>
            </div>
          </div>
        </section>

        <section className="py-8 bg-white min-h-[400px]">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex justify-center items-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#2e4c7e]" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 space-y-4">
                <p className="text-[#777] text-base">
                  {activeMenuGroup !== "ALL"
                    ? `Chưa có sản phẩm trong nhóm ${MENU_GROUP_LABELS[activeMenuGroup]}.`
                    : "Chưa có sản phẩm phù hợp bộ lọc này."}
                </p>
                <button
                  type="button"
                  onClick={() => handleMenuGroupChange("ALL")}
                  className="text-[#2e4c7e] text-sm font-semibold hover:underline"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-10">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border border-[#e8d8c3]/60 text-[#555] hover:bg-[#eef2f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Trước
                    </button>
                    <span className="text-sm text-[#777] font-medium">
                      Trang <span className="text-[#333] font-bold">{page}</span> / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border border-[#e8d8c3]/60 text-[#555] hover:bg-[#eef2f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#c9a15c]" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
