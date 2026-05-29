"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/CartContext";

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

const fallbackBestSellers: ProductType[] = [
  {
    id: "fb-1",
    name: "Lược Khảm Trai Dáng Tròn Cổ Điển",
    price: 450000,
    formattedPrice: "450.000₫",
    rating: 5,
    reviews: 128,
    image: "/images/products/ring-1.png",
    hoverImage: "/images/products/ring-2.png",
    slug: "luoc-kham-trai-dang-tron",
    sold: 152
  },
  {
    id: "fb-2",
    name: "Khuyên Tai Khảm Xà Cừ Rose Gold",
    price: 320000,
    formattedPrice: "320.000₫",
    rating: 5,
    reviews: 86,
    image: "/images/products/earrings-1.png",
    hoverImage: "/images/products/necklace-1.png",
    slug: "khuyen-tai-kham-xa-cu",
    sold: 140
  },
  {
    id: "fb-3",
    name: "Trâm Cài Tóc Mỹ Nghệ Sen Ngọc",
    price: 680000,
    formattedPrice: "680.000₫",
    rating: 5,
    reviews: 214,
    image: "/images/products/ring-2.png",
    hoverImage: "/images/products/ring-1.png",
    slug: "tram-cai-toc-sen-ngoc",
    sold: 98
  },
  {
    id: "fb-4",
    name: "Nhẫn Khảm Ngọc Trai Hoàng Gia",
    price: 890000,
    formattedPrice: "890.000₫",
    rating: 4,
    reviews: 67,
    image: "/images/products/necklace-1.png",
    hoverImage: "/images/products/earrings-1.png",
    slug: "nhan-kham-ngoc-trai-hoang-gia",
    sold: 85
  },
];

interface ApiProduct {
  _id: string;
  name: string;
  price: number;
  sold?: number;
  images?: { url: string }[];
  slug?: string;
}

export function BestSeller() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch("http://localhost:5000/api/products?sort=-sold&limit=8")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          const mapped = data.data.map((p: ApiProduct) => {
            return {
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
            };
          });
          setProducts(mapped);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching best sellers:", err);
        setLoading(false);
      });
  }, []);

  const displayProducts = products.length > 0 ? products : fallbackBestSellers;

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif text-[#333] mb-3">Sản Phẩm Bán Chạy Nhất</h2>
          <div className="w-16 h-0.5 bg-[#2e4c7e] mx-auto mb-4" />
          <p className="text-[#777] text-sm max-w-md mx-auto">
            Những sản phẩm mỹ nghệ khảm xà cừ tinh xảo bán chạy nhất, được khách hàng yêu thích và lựa chọn
          </p>
        </div>

        {loading && products.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#aaa]">Đang tải sản phẩm...</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map((product) => (
              <div key={product.id} className="group">
                <div className="bg-white rounded-2xl overflow-hidden border border-[#e2e8f0] hover:border-[#1b2a4a]/30 hover:shadow-xl hover:shadow-[#1b2a4a]/10 transition-all duration-500">
                  {/* Image with hover swap */}
                  <div className="relative aspect-square bg-[#faf8f6] overflow-hidden">
                    {/* Link to detail page */}
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

                    {/* Add to cart */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <button
                        onClick={() => addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image
                        })}
                        className="w-full flex items-center justify-center gap-2 bg-[#2e4c7e] text-white py-3 rounded-xl text-xs font-medium hover:bg-[#1b2a4a] transition-colors shadow-lg pointer-events-auto"
                      >
                        <ShoppingCart className="w-4 h-4" /> Thêm Vào Giỏ
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 text-center space-y-2">
                    <Link href={`/san-pham/${product.slug}`}>
                      <h3 className="text-sm font-medium text-[#333] line-clamp-2 min-h-[40px] group-hover:text-[#1b2a4a] transition-colors hover:underline">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex justify-between items-center px-1">
                      <p className="text-[#1b2a4a] font-bold">{product.formattedPrice}</p>
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
  );
}

