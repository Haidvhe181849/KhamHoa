"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Star, ShoppingCart, ShieldCheck, Truck, RefreshCw, ChevronRight, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import ProductReviews from "@/components/products/ProductReviews";

interface ProductType {
  _id: string;
  name: string;
  price: number;
  stock: number;
  sold: number;
  description?: string;
  categoryId?: {
    _id: string;
    name: string;
  };
  images: Array<{ url: string; public_id: string }>;
  slug: string;
  rating?: number;
  reviewsCount?: number;
}

const fallbackProduct: ProductType = {
  _id: "fb-detail",
  name: "Lược Mỹ Nghệ Khảm Xà Cừ Cao Cấp",
  price: 450000,
  stock: 15,
  sold: 84,
  description: "Sản phẩm được chế tác thủ công tinh xảo bởi các nghệ nhân giàu kinh nghiệm. Vỏ xà cừ được lựa chọn kỹ lưỡng mang lại độ sáng và hiệu ứng cầu vồng lấp lánh tự nhiên dưới ánh sáng. Lược gỗ khảm trai không chỉ có tác dụng chải tóc thông thường mà còn là món quà tặng vô cùng ý nghĩa và tinh tế dành cho những người thân yêu.",
  categoryId: {
    _id: "6a06019e1e4a1d7dea21b1a1",
    name: "Lược"
  },
  images: [
    { url: "/images/products/ring-1.png", public_id: "1" },
    { url: "/images/products/ring-2.png", public_id: "2" }
  ],
  slug: "luoc-my-nghe-kham-xa-cu"
};

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<ProductType | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductType[]>([]);
  const [activeImage, setActiveImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch product details by slug
    fetch(`http://localhost:5000/api/products/slug/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProduct(data.data);
          setActiveImage(data.data.images?.[0]?.url || "/images/products/ring-1.png");
          
          // Fetch related products using category ID
          if (data.data.categoryId?._id) {
            fetch(`http://localhost:5000/api/products?categoryId=${data.data.categoryId._id}&limit=4`)
              .then((r) => r.json())
              .then((relData) => {
                if (relData.success && relData.data) {
                  // filter out current product
                  const filtered = relData.data.filter((p: ProductType) => p._id !== data.data._id);
                  setRelatedProducts(filtered);
                }
              })
              .catch((err) => console.error("Error fetching related products:", err));
          }
        } else {
          setProduct(fallbackProduct);
          setActiveImage(fallbackProduct.images[0].url);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching product detail:", err);
        setProduct(fallbackProduct);
        setActiveImage(fallbackProduct.images[0].url);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-white pt-24">
        <Navbar />
        <div className="flex-1 flex justify-center items-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#2e4c7e]" />
        </div>
        <Footer />
      </div>
    );
  }

  const currentProduct = product || fallbackProduct;
  const isOutOfStock = currentProduct.stock <= 0;

  const handleAddToCart = () => {
    addToCart({
      id: currentProduct._id,
      name: currentProduct.name,
      price: currentProduct.price,
      image: currentProduct.images?.[0]?.url || "/images/products/ring-1.png",
      categoryName: currentProduct.categoryId?.name
    }, quantity);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/gio-hang");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white pt-24">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <div className="text-xs uppercase tracking-wider text-[#999] mb-8 flex items-center gap-2">
            <Link href="/" className="hover:text-[#2e4c7e] transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3" />
            {currentProduct.categoryId && (
              <>
                <Link href={`/danh-muc/${currentProduct.categoryId._id}`} className="hover:text-[#2e4c7e] transition-colors">
                  {currentProduct.categoryId.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-[#2e4c7e] font-semibold line-clamp-1">{currentProduct.name}</span>
          </div>

          {/* Product Detail Layout */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 mb-16">
            {/* Left: Image Gallery */}
            <div className="space-y-4">
              {/* Main Image Frame */}
              <div className="relative aspect-square w-full bg-[#faf8f6] rounded-3xl border border-[#e2e8f0] overflow-hidden group">
                <Image
                  src={activeImage}
                  alt={currentProduct.name}
                  fill
                  className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>

              {/* Thumbnails */}
              {currentProduct.images && currentProduct.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto py-1">
                  {currentProduct.images.map((img, i) => (
                    <button
                      key={img.public_id || i}
                      onClick={() => setActiveImage(img.url)}
                      className={`relative w-20 h-20 rounded-xl bg-[#faf8f6] border overflow-hidden transition-all ${
                        activeImage === img.url
                          ? "border-[#2e4c7e] ring-2 ring-[#eef2f6]"
                          : "border-[#e2e8f0] hover:border-[#2e4c7e]/40"
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={`Thumbnail ${i}`}
                        fill
                        className="object-contain p-2"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="flex flex-col justify-between py-2 space-y-6">
              <div className="space-y-4">
                {currentProduct.categoryId && (
                  <span className="text-xs font-bold text-[#2e4c7e] tracking-widest uppercase">
                    {currentProduct.categoryId.name}
                  </span>
                )}
                <h1 className="text-2xl md:text-3xl font-serif text-[#333] tracking-wide leading-tight">
                  {currentProduct.name}
                </h1>

                {/* Rating & Sold count */}
                <div className="flex items-center gap-4 text-sm text-[#777]">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#f5a623] text-[#f5a623]" />
                    <span className="font-semibold text-[#333] ml-1">{currentProduct.rating || "5.0"}</span>
                  </div>
                  <span className="text-[#ddd]">|</span>
                  <span className="text-[#333]">{currentProduct.reviewsCount || 0} Đánh giá</span>
                  <span className="text-[#ddd]">|</span>
                  <span>Đã bán <span className="font-bold text-[#333]">{currentProduct.sold}</span></span>
                </div>

                {/* Price tag */}
                <div className="bg-[#faf8f6] p-5 rounded-2xl border border-[#e2e8f0] flex items-center justify-between">
                  <div className="text-2xl md:text-3xl font-bold text-[#2e4c7e]">
                    {currentProduct.price.toLocaleString("vi-VN")}₫
                  </div>
                  <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    {isOutOfStock ? "Tạm Hết Hàng" : `Còn lại ${currentProduct.stock} sản phẩm`}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#333]">Mô tả sản phẩm</h4>
                  <p className="text-sm text-[#666] leading-relaxed font-medium">
                    {currentProduct.description}
                  </p>
                </div>
              </div>

              {/* Add to cart Actions */}
              <div className="space-y-6 pt-4 border-t border-[#e2e8f0]">
                {!isOutOfStock && (
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#333]">Số lượng:</span>
                    <div className="flex items-center border border-[#e2d8cf] rounded-xl overflow-hidden bg-[#faf8f6]">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2 text-[#777] hover:bg-[#eef2f6] hover:text-[#2e4c7e] transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-4 text-sm font-semibold text-[#333] w-12 text-center select-none">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(currentProduct.stock, quantity + 1))}
                        className="px-3 py-2 text-[#777] hover:bg-[#eef2f6] hover:text-[#2e4c7e] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex-1 bg-[#2e4c7e] hover:bg-[#1b2a4a] text-white py-4 rounded-xl text-sm font-semibold shadow-lg shadow-[#2e4c7e]/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:bg-gray-200 disabled:shadow-none"
                  >
                    Mua Ngay
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex-1 bg-white border-2 border-[#2e4c7e] text-[#2e4c7e] hover:bg-[#eef2f6]/30 py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:border-gray-200 disabled:text-gray-400"
                  >
                    <ShoppingCart className="w-4 h-4" /> Thêm Vào Giỏ
                  </button>
                </div>

                {/* Features list */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="flex flex-col items-center p-3 bg-[#faf8f6] rounded-xl border border-[#e2e8f0]/40">
                    <ShieldCheck className="w-5 h-5 text-[#2e4c7e] mb-1.5" />
                    <span className="text-[10px] text-[#555] font-semibold">100% Thủ Công</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-[#faf8f6] rounded-xl border border-[#e2e8f0]/40">
                    <Truck className="w-5 h-5 text-[#2e4c7e] mb-1.5" />
                    <span className="text-[10px] text-[#555] font-semibold">Giao Toàn Quốc</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-[#faf8f6] rounded-xl border border-[#e2e8f0]/40">
                    <RefreshCw className="w-5 h-5 text-[#2e4c7e] mb-1.5" />
                    <span className="text-[10px] text-[#555] font-semibold">Đổi Trả 7 Ngày</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Reviews Section */}
          {currentProduct._id !== "fb-detail" && (
            <ProductReviews productId={currentProduct._id} />
          )}

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <div className="pt-10 border-t border-[#e2e8f0] mt-16">
              <h2 className="text-xl md:text-2xl font-serif text-[#333] mb-8">Sản phẩm liên quan</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((p) => {
                  const mappedPrice = p.price.toLocaleString("vi-VN") + "₫";
                  const pImage = p.images?.[0]?.url || "/images/products/ring-1.png";
                  const pHoverImage = p.images?.[1]?.url || pImage;

                  return (
                    <div key={p._id} className="group">
                      <div className="bg-white rounded-2xl overflow-hidden border border-[#e2e8f0] hover:border-[#2e4c7e]/30 hover:shadow-xl transition-all duration-500">
                        <div className="relative aspect-square bg-[#faf8f6] overflow-hidden">
                          <Link href={`/san-pham/${p.slug}`}>
                            <Image src={pHoverImage} alt={p.name} fill className="object-contain p-6 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                            <Image src={pImage} alt={p.name} fill className="object-contain p-6 group-hover:opacity-0 transition-opacity duration-500" />
                          </Link>
                        </div>
                        <div className="p-4 text-center space-y-1">
                          <Link href={`/san-pham/${p.slug}`}>
                            <h4 className="text-xs font-semibold text-[#333] line-clamp-1 group-hover:text-[#2e4c7e] transition-colors hover:underline">
                              {p.name}
                            </h4>
                          </Link>
                          <p className="text-xs text-[#2e4c7e] font-bold">{mappedPrice}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
