"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import type { ProductListItem } from "@/lib/products";

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div className="group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#f4f8ff] hover:border-[#1b2a4a]/40 hover:shadow-xl hover:shadow-[#1b2a4a]/15 transition-all duration-500">
        <div className="relative aspect-square bg-[#f4f8ff] overflow-hidden">
          <Link href={`/san-pham/${product.slug}`}>
            <Image
              src={product.hoverImage}
              alt={`${product.name} - góc nhìn khác`}
              fill
              className="object-contain p-6 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
            />
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-6 group-hover:opacity-0 transition-opacity duration-500"
            />
          </Link>

          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button
              type="button"
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[#1b2a4a] hover:text-white text-[#555] transition-colors"
              aria-label="Yêu thích"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              type="button"
              onClick={() =>
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  categoryName: product.categoryName,
                })
              }
              className="w-full flex items-center justify-center gap-2 bg-[#1b2a4a] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#2e4c7e] hover:shadow-lg hover:shadow-[#1b2a4a]/30 transition-all active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" /> Thêm Vào Giỏ
            </button>
          </div>
        </div>

        <div className="p-4 text-center space-y-2">
          {product.categoryName && (
            <p className="text-[10px] uppercase tracking-wider text-[#1b2a4a] font-bold">
              {product.categoryName}
            </p>
          )}
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
  );
}
