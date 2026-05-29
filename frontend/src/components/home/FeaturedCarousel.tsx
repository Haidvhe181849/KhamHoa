"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { API_BASE_URL } from "@/lib/api";
import { useCart } from "@/lib/CartContext";

type FeaturedProduct = {
  id: string;
  slug: string;
  name: string;
  price: string;
  rawPrice: number;
  oldPrice: string;
  image: string;
  badge: string;
  isNew: boolean;
};

export function FeaturedCarousel() {
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products?limit=12`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          const formatted: FeaturedProduct[] = data.data.map((p: { _id: string; slug: string; name: string; price: number; images?: { url: string }[] }, idx: number) => {
            const formattedPrice = p.price.toLocaleString("vi-VN") + "₫";
            // Create a premium discount layout
            const rawOldPrice = Math.round((p.price * 1.15) / 50000) * 50000;
            const oldPrice = rawOldPrice.toLocaleString("vi-VN") + "₫";
            return {
              id: p._id,
              slug: p.slug || p._id,
              name: p.name,
              price: formattedPrice,
              rawPrice: p.price,
              oldPrice: oldPrice,
              image: p.images?.[0]?.url || "/images/products/ring-1.png",
              badge: "-13%",
              isNew: idx < 3
            };
          });
          setProducts(formatted);
        }
      })
      .catch((err) => console.error("Error fetching featured products:", err));
  }, []);

  return (
    <section id="featured" className="py-16 md:py-20 bg-white scroll-mt-28">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif text-[#333] mb-2">Sản Phẩm Nổi Bật</h2>
            <div className="w-16 h-0.5 bg-[#2e4c7e]" />
          </div>
          <Link href="/san-pham" className="text-sm text-[#2e4c7e] hover:underline underline-offset-4 font-medium hidden md:block">
            Xem tất cả →
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-sm text-[#aaa] py-12">Đang tải sản phẩm...</p>
        ) : (
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[plugin.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-3 md:-ml-4">
              {products.map((product) => (
                <CarouselItem key={product.id} className="pl-3 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <div className="group relative bg-white rounded-2xl overflow-hidden border border-[#e2e8f0] hover:border-[#2e4c7e]/30 hover:shadow-xl hover:shadow-[#2e4c7e]/10 transition-all duration-500">
                    {/* Image */}
                    <div className="relative aspect-square bg-[#faf8f6] overflow-hidden">
                      {product.badge && (
                        <span className="absolute top-3 left-3 z-10 bg-[#2e4c7e] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {product.badge}
                        </span>
                      )}
                      {product.isNew && (
                        <span className="absolute top-3 right-14 z-10 bg-[#333] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          MỚI
                        </span>
                      )}

                      {/* Add to cart button */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <button
                          onClick={() => addToCart({ id: product.id, name: product.name, price: product.rawPrice, image: product.image })}
                          className="w-full flex items-center justify-center gap-2 bg-[#2e4c7e] text-white py-2.5 rounded-xl text-xs font-medium hover:bg-[#1f3a63] transition-colors shadow-lg"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Thêm Vào Giỏ
                        </button>
                      </div>

                      <Link href={`/san-pham/${product.slug}`}>
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-6 transition-transform duration-700 group-hover:scale-110"
                        />
                      </Link>
                    </div>

                    {/* Info */}
                    <div className="p-4 text-center">
                      <Link href={`/san-pham/${product.slug}`}>
                        <h3 className="text-sm font-medium text-[#333] mb-2 line-clamp-1 group-hover:text-[#2e4c7e] transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[#2e4c7e] font-bold text-sm">{product.price}</span>
                        {product.oldPrice && (
                          <span className="text-[#aaa] line-through text-xs">{product.oldPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-3 mt-8">
              <CarouselPrevious className="static translate-y-0 w-10 h-10 border-[#2e4c7e] text-[#2e4c7e] hover:bg-[#2e4c7e] hover:text-white" />
              <CarouselNext className="static translate-y-0 w-10 h-10 border-[#2e4c7e] text-[#2e4c7e] hover:bg-[#2e4c7e] hover:text-white" />
            </div>
          </Carousel>
        )}
      </div>
    </section>
  );
}
