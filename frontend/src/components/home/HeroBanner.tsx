"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

const slides = [
  {
    id: 1,
    // promo: "Tinh Hoa Di Sản",
    headline: "Tinh Hoa Khảm Trai Việt",
    subHeadline: "Từ những mảnh xà cừ tự nhiên qua đôi bàn tay nghệ nhân lâu đời, mỗi sản phẩm tại Khảm Hoa là một kiệt tác di sản văn hóa độc bản.",
    image: "", // Embedded in the premium bgImage!
    bgImage: "/images/banners/hero-banner-artisan.png",
    cta: "Khám Phá Sản Phẩm",
    ctaSecondary: "Về Chúng Tôi",
    link: "/san-pham",
    linkSecondary: "/gioi-thieu",
  },
  {
    id: 2,
    // promo: "Bộ Sưu Tập Mới",
    headline: "TRANG SỨC\nKHẢM XÀ CỪ TỰ NHIÊN",
    subHeadline: "Nhẫn, dây chuyền, bông tai và vòng tay mang vẻ đẹp thanh lịch độc bản, óng ánh sắc màu chuyển sắc kỳ ảo của đại dương.",
    image: "/images/products/nhan-xa-cu.png",
    bgImage: "",
    cta: "Xem Trang Sức",
    ctaSecondary: "Xem Chi Tiết",
    link: "/danh-muc/nhan",
    linkSecondary: "/san-pham",
  },
  {
    id: 3,
    // promo: "Quà Tặng Ý Nghĩa",
    headline: "PHỤ KIỆN\nMỸ NGHỆ THỦ CÔNG",
    subHeadline: "Lược khảm trai dáng tròn cổ điển và trâm cài tóc tinh xảo — tôn vinh nét duyên dáng thanh lịch và giá trị văn hóa nghệ thuật truyền thống.",
    image: "/images/products/phu-kien-toc-xa-cu.png",
    bgImage: "",
    cta: "Xem Phụ Kiện",
    ctaSecondary: "Xem Tất Cả",
    link: "/danh-muc/phu-kien-toc",
    linkSecondary: "/san-pham",
  },
];

export function HeroBanner() {
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <section className="relative w-full overflow-hidden">
      {/* Floating animation keyframes styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes banner-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-banner-float {
          animation: banner-float 5s ease-in-out infinite;
        }
      `}} />

      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        opts={{ loop: true }}
      >
        <CarouselContent className="ml-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-0">
              <div
                className={`relative w-full min-h-[380px] sm:min-h-[500px] md:min-h-[650px] lg:min-h-[750px] flex items-center transition-all duration-700 ${slide.bgImage
                  ? "bg-cover bg-center"
                  : "bg-gradient-to-br from-[#f0f7ff] via-[#fafdff] to-[#e6f0fa]"
                  }`}
                style={slide.bgImage ? { backgroundImage: `url(${slide.bgImage})` } : {}}
              >
                {/* Visual Overlay for background images to ensure high text contrast (using subtle overlay only if needed, currently transparent to let the full 100% width image shine) */}

                <div className="container mx-auto px-4 md:px-6 h-full z-10 relative">
                  <div className="grid grid-cols-12 gap-4 sm:gap-12 items-center py-4 sm:py-16 lg:py-0 h-full">

                    {/* Text Content - LEFT */}
                    <div className="col-span-7 sm:col-span-6 flex flex-col justify-center text-left order-1 px-1 sm:px-0">

                      {/* Elegant Glassmorphic Badge Pill */}
                      {/* <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-md border border-white/40 px-5 py-2.5 rounded-full text-xs tracking-wider mb-6 w-fit mx-auto lg:mx-0 shadow-sm shadow-[#2e4c7e]/10">
                        <span className="font-bold text-[#b47a72] uppercase tracking-[0.22em] text-[10px]">
                          {slide.promo}
                        </span>
                        <span className="w-px h-3 bg-[#2e4c7e]/30" />
                        <span className="text-[#888] text-[9px] tracking-widest uppercase font-bold">
                          Khảm Hoa Store
                        </span>
                      </div> */}

                      {/* Main Headline */}
                      <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-[3.75rem] font-serif text-[#333] leading-[1.2] sm:leading-[1.15] mb-2 sm:mb-6 whitespace-pre-line">
                        {slide.headline}
                      </h1>

                      {/* Sub-headline */}
                      <p className="block text-[#666] text-[10px] sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-light line-clamp-3 sm:line-clamp-none">
                        {slide.subHeadline}
                      </p>

                      {/* CTAs */}
                      <div className="flex gap-2 sm:gap-3.5 justify-start">
                        <Link href={slide.link} passHref>
                          <Button className="bg-[#2e4c7e] hover:bg-[#1f3a63] text-white px-3 sm:px-9 py-2 sm:py-6.5 text-[9px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase rounded-full shadow-md shadow-[#2e4c7e]/20 hover:shadow-lg transition-all duration-300">
                            {slide.cta}
                          </Button>
                        </Link>
                        {slide.ctaSecondary && (
                          <Link href={slide.linkSecondary} passHref className="hidden sm:block">
                            <Button variant="outline" className="border-2 border-[#2e4c7e] text-[#2e4c7e] hover:bg-[#2e4c7e] hover:text-white px-9 py-6.5 text-xs font-semibold tracking-widest uppercase rounded-full transition-all duration-300 bg-transparent">
                              {slide.ctaSecondary}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Image block - RIGHT (Inspired directly by the Huy Thanh float & collage design!) */}
                    <div className="col-span-5 sm:col-span-6 flex items-center justify-center relative order-2 mb-0">
                      {/* If the slide is NOT using a full background image, render the premium floating composition dynamically! */}
                      {!slide.bgImage && slide.image ? (
                        <div className="relative w-[120px] h-[120px] sm:w-[280px] sm:h-[280px] md:w-[440px] md:h-[440px] lg:w-[500px] lg:h-[500px]">
                          {/* Soft decorative background shadow */}
                          <div className="absolute inset-2 sm:inset-8 rounded-full bg-gradient-to-br from-[#eef2f6]/60 to-[#e8d8c3]/40 blur-2xl" />

                          {/* 1. Main Transparent Product (Floating) */}
                          <div className="relative w-full h-[90%] z-20 animate-banner-float">
                            <Image
                              src={slide.image}
                              alt={slide.headline}
                              fill
                              className="object-contain drop-shadow-[0_15px_20px_rgba(216,163,157,0.2)] sm:drop-shadow-[0_25px_30px_rgba(216,163,157,0.3)] transition-transform duration-700 hover:scale-[1.03]"
                              priority
                            />
                          </div>

                          {/* 2. Floating Polaroid Fan (Artisan Workshop Collage) */}
                          <div className="hidden sm:flex absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-[95%] justify-center gap-2.5 z-10 rotate-[-2deg]">

                            {/* Polaroid 1 */}
                            <div className="w-16 h-20 sm:w-22 sm:h-26 bg-white p-1.5 shadow-xl border border-[#e2e8f0] rounded -rotate-12 transition-all hover:rotate-0 hover:scale-110 duration-300 cursor-pointer">
                              <div className="relative w-full h-[76%] overflow-hidden bg-[#faf8f6] rounded-sm">
                                <Image
                                  src="/images/products/nhan-xa-cu.png"
                                  alt="Lớp khảm xà cừ tự nhiên"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="text-[5px] sm:text-[6px] text-center font-bold text-[#888] mt-1 font-serif">Khảm nghệ thuật</div>
                            </div>

                            {/* Polaroid 2 */}
                            <div className="w-16 h-20 sm:w-22 sm:h-26 bg-white p-1.5 shadow-xl border border-[#e2e8f0] rounded rotate-2 translate-y-1.5 transition-all hover:rotate-0 hover:scale-110 duration-300 cursor-pointer">
                              <div className="relative w-full h-[76%] overflow-hidden bg-[#faf8f6] rounded-sm">
                                <Image
                                  src="/images/products/phu-kien-toc-xa-cu.png"
                                  alt="Mỹ nghệ thủ công truyền thống"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="text-[5px] sm:text-[6px] text-center font-bold text-[#888] mt-1 font-serif">Chế tác thủ công</div>
                            </div>

                            {/* Polaroid 3 */}
                            <div className="w-16 h-20 sm:w-22 sm:h-26 bg-white p-1.5 shadow-xl border border-[#e2e8f0] rounded rotate-12 transition-all hover:rotate-0 hover:scale-110 duration-300 cursor-pointer">
                              <div className="relative w-full h-[76%] overflow-hidden bg-[#faf8f6] rounded-sm">
                                <Image
                                  src="/images/products/day-chuyen-xa-cu.png"
                                  alt="Chi tiết óng ánh xà cừ"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="text-[5px] sm:text-[6px] text-center font-bold text-[#888] mt-1 font-serif">Vẻ đẹp độc bản</div>
                            </div>

                          </div>
                        </div>
                      ) : (
                        // If it's a full-width background image slide, we leave this block empty so the background design is fully visible on the right
                        <div className="w-full h-[150px] lg:h-full lg:min-h-[500px]" />
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Arrows */}
        <CarouselPrevious className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/70 hover:bg-white text-[#333] border-none shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95" />
        <CarouselNext className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/70 hover:bg-white text-[#333] border-none shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95" />
      </Carousel>
    </section>
  );
}


