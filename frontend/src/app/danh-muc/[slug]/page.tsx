"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Star, ShoppingCart, Heart, ArrowUpDown } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { API_BASE_URL } from "@/lib/api";

interface ProductType {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  rating: number;
  reviews: number;
  image: string;
  hoverImage: string;
  slug: string;
  sold: number;
}

interface CategoryType {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

// Removed mock data as requested

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const { addToCart } = useCart();
  const [categoryInfo, setCategoryInfo] = useState<{ name: string; description: string }>({
    name: "Danh Mục Sản Phẩm",
    description: "Trang sức và phụ kiện nghệ thuật khảm xà cừ cao cấp."
  });
  const [products, setProducts] = useState<ProductType[]>([]);
  const [sortOption, setSortOption] = useState<string>("default");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Fetch categories to find matching slug
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((catData) => {
        if (catData.success && catData.data) {
          const matched = catData.data.find((c: CategoryType) => c.slug === slug);
          if (matched) {
            setCategoryInfo({
              name: matched.name,
              description: matched.description || "Các sản phẩm nghệ thuật khảm xà cừ cao cấp."
            });
            
            // 2. Fetch products for this category (tăng limit lên 50 để lấy hết, vì mặc định API trả về 10)
            fetch(`${API_BASE_URL}/api/products?categoryId=${matched._id}&limit=50`)
              .then((res) => res.json())
              .then((prodData) => {
                if (prodData.success && prodData.data && prodData.data.length > 0) {
                  const mapped = prodData.data.map((p: { _id: string; name: string; price: number; sold?: number; images?: { url: string }[]; slug?: string }) => ({
                    id: p._id,
                    name: p.name,
                    price: p.price,
                    formattedPrice: p.price.toLocaleString("vi-VN") + "₫",
                    rating: 5,
                    reviews: p.sold && p.sold > 0 ? Math.round(p.sold * 0.4) : 12,
                    image: p.images?.[0]?.url || "/images/products/ring-1.png",
                    hoverImage: p.images?.[1]?.url || p.images?.[0]?.url || "/images/products/ring-2.png",
                    slug: p.slug || p._id,
                    sold: p.sold || 0
                  }));
                  setProducts(mapped);
                } else {
                  setProducts([]);
                }
                setLoading(false);
              })
              .catch((err) => {
                console.error("Error fetching products:", err);
                setProducts([]);
                setLoading(false);
              });
          } else {
            // No matching category in DB
            setCategoryInfo({
              name: "Danh Mục Trống",
              description: "Danh mục này hiện không tồn tại hoặc đã bị xóa."
            });
            setProducts([]);
            setLoading(false);
          }
        } else {
          setProducts([]);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setProducts([]);
        setLoading(false);
      });
  }, [slug]);

  // Sorting logic
  const sortedProducts = [...products].sort((a, b) => {
    if (sortOption === "price-asc") return a.price - b.price;
    if (sortOption === "price-desc") return b.price - a.price;
    if (sortOption === "best-seller") return b.sold - a.sold;
    return 0; // Default sorting
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white pt-24">
      <Navbar />
      
      <main className="flex-1">
        {/* Banner Section */}
        <section className="bg-gradient-to-b from-[#eef2f6]/60 to-[#faf8f6]/30 py-16 text-center">
          <div className="container mx-auto px-4 max-w-3xl">
            {/* Breadcrumbs */}
            <div className="text-[11px] uppercase tracking-wider text-[#999] mb-4 flex justify-center gap-2">
              <Link href="/" className="hover:text-[#2e4c7e] transition-colors">Trang chủ</Link>
              <span>/</span>
              <span className="text-[#2e4c7e] font-semibold">{categoryInfo.name}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-serif text-[#333] mb-4 tracking-wide">{categoryInfo.name}</h1>
            <div className="w-16 h-0.5 bg-[#2e4c7e] mx-auto mb-5" />
            <p className="text-sm text-[#777] leading-relaxed font-medium">
              {categoryInfo.description}
            </p>
          </div>
        </section>

        {/* Toolbar section */}
        <section className="border-y border-[#e2e8f0] bg-white py-4 sticky top-24 z-30 shadow-sm shadow-[#333]/[0.01]">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-[#777] font-medium">
              Hiển thị <span className="text-[#333] font-bold">{sortedProducts.length}</span> sản phẩm
            </span>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#2e4c7e]" />
                <span className="text-xs text-[#777]">Sắp xếp:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="text-xs text-[#333] font-semibold border-none focus:ring-0 bg-transparent cursor-pointer hover:text-[#2e4c7e] transition-colors"
                >
                  <option value="default">Mặc định</option>
                  <option value="best-seller">Bán chạy nhất</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#2e4c7e]" />
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-24 space-y-6 max-w-lg mx-auto bg-[#f4f8ff]/50 border border-[#e2e8f0] rounded-3xl">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-[#e2e8f0]">
                  <ShoppingCart className="w-8 h-8 text-[#2e4c7e] opacity-50" />
                </div>
                <div className="space-y-2 px-6">
                  <h3 className="text-[#1b2a4a] text-xl font-serif font-bold">Chưa có sản phẩm</h3>
                  <p className="text-[#777] text-sm leading-relaxed">Bộ sưu tập này hiện đang được nghệ nhân chế tác hoặc đã hết hàng. Vui lòng quay lại sau hoặc khám phá các danh mục khác nhé.</p>
                </div>
                <Link href="/san-pham" className="inline-block px-8 py-3.5 bg-[#1b2a4a] hover:bg-[#2e4c7e] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all hover:shadow-lg hover:shadow-[#1b2a4a]/20 hover:-translate-y-0.5">
                  Khám phá cửa hàng
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {sortedProducts.map((product) => (
                  <div key={product.id} className="group">
                    <div className="bg-white rounded-2xl overflow-hidden border border-[#e2e8f0] hover:border-[#2e4c7e]/30 hover:shadow-xl hover:shadow-[#2e4c7e]/10 transition-all duration-500">
                      {/* Image with hover swap */}
                      <div className="relative aspect-square bg-[#faf8f6] overflow-hidden">
                        <Link href={`/san-pham/${product.slug}`}>
                          {/* Hover Image */}
                          <Image
                            src={product.hoverImage}
                            alt={`${product.name} - góc nhìn khác`}
                            fill
                            className="object-contain p-6 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
                          />
                          {/* Primary Image */}
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain p-6 group-hover:opacity-0 transition-opacity duration-500"
                          />
                        </Link>

                        {/* Quick Actions */}
                        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#2e4c7e] hover:text-white text-[#555] transition-colors" aria-label="Yêu thích">
                            <Heart className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Add to cart */}
                        <div className="absolute bottom-0 left-0 right-0 z-20 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <button
                            onClick={() => addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.image
                            })}
                            className="w-full flex items-center justify-center gap-2 bg-[#2e4c7e] text-white py-3 rounded-xl text-xs font-medium hover:bg-[#1b2a4a] transition-colors shadow-lg"
                          >
                            <ShoppingCart className="w-4 h-4" /> Thêm Vào Giỏ
                          </button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 text-center space-y-2">
                        {/* Rating */}
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < product.rating ? "fill-[#f5a623] text-[#f5a623]" : "text-[#ddd]"}`}
                            />
                          ))}
                          <span className="text-[10px] text-[#999] ml-1">({product.reviews})</span>
                        </div>

                        <Link href={`/san-pham/${product.slug}`}>
                          <h3 className="text-sm font-medium text-[#333] line-clamp-2 min-h-[40px] group-hover:text-[#2e4c7e] transition-colors hover:underline">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex justify-between items-center px-1">
                          <p className="text-[#2e4c7e] font-bold">{product.formattedPrice}</p>
                          <span className="text-[10px] text-[#aaa] font-medium">Đã bán {product.sold}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
