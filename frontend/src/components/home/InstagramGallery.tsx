import Image from "next/image";
import { FaInstagram } from "react-icons/fa";

const photos = [
  { id: 1, src: "/images/products/ring-1.png", span: "col-span-2 row-span-2" },
  { id: 2, src: "/images/products/earrings-1.png", span: "col-span-1 row-span-1" },
  { id: 3, src: "/images/products/necklace-1.png", span: "col-span-1 row-span-1" },
  { id: 4, src: "/images/products/ring-2.png", span: "col-span-1 row-span-1" },
  { id: 5, src: "/images/products/bracelet-1.png", span: "col-span-1 row-span-1" },
  { id: 6, src: "/images/banners/hero-banner.png", span: "col-span-2 row-span-1" },
];

export function InstagramGallery() {
  return (
    <section className="py-16 md:py-20 bg-[#faf8f6]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif text-[#333] mb-3">@KhamHoaJewelry</h2>
          <div className="w-16 h-0.5 bg-[#2e4c7e] mx-auto mb-4" />
          <p className="text-[#777] text-sm max-w-md mx-auto">
            Theo dõi chúng tôi trên Instagram để cập nhật những mẫu mới nhất
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[200px]">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative overflow-hidden group rounded-2xl cursor-pointer ${photo.span}`}
            >
              <div className="absolute inset-0 bg-[#faf8f6]">
                <Image
                  src={photo.src}
                  alt="Instagram - Kham Hoa Jewelry"
                  fill
                  className="object-contain p-4 transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-[#2e4c7e]/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                <FaInstagram className="w-7 h-7 text-white" />
                <span className="text-white font-medium text-xs tracking-wider uppercase">Xem Chi Tiết</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
