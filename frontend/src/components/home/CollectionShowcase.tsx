import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ImageLayout = "portrait" | "landscape" | "square";

const collections: {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: string;
  href: string;
  bgColor: string;
  reverse: boolean;
  imageLayout: ImageLayout;
}[] = [
    {
      id: 1,
      title: "Trang Sức Khảm Trai",
      subtitle: "MOTHER OF PEARL JEWELRY",
      description:
        "Nhẫn, dây chuyền, bông tai và vòng tay khảm trai mang vẻ đẹp tự nhiên, sang trọng và thanh quý của xà cừ đại dương.",
      image: "/images/products/day-chuyen-xa-cu.png",
      cta: "Khám Phá Ngay",
      href: "/danh-muc/day-chuyen-vong-tay",
      bgColor: "from-[#f0f7ff] to-[#f6faff]",
      reverse: false,
      imageLayout: "landscape",
    },
    {
      id: 2,
      title: "Phụ Kiện Thủ Công",
      subtitle: "HANDCRAFTED ACCESSORIES",
      description:
        "Những thiết kế lược bán nguyệt, kẹp tóc và trâm cài tóc chế tác tinh xảo, điểm xuyết họa tiết truyền thống óng ánh giúp hoàn thiện phong cách riêng.",
      image: "/images/products/phu-kien-toc-xa-cu.png",
      cta: "Xem Bộ Sưu Tập",
      href: "/danh-muc/phu-kien-toc",
      bgColor: "from-[#f0f7ff] to-[#f6faff]",
      reverse: true,
      imageLayout: "landscape",
    },
    {
      id: 3,
      title: "Quà Tặng Ý Nghĩa",
      subtitle: "MEANINGFUL ARTISAN GIFTS",
      description:
        "Những món quà mang trọn giá trị thủ công mỹ nghệ tinh xảo, chứa đựng câu chuyện di sản và nét đẹp văn hóa lâu đời của Việt Nam.",
      image: "/images/products/nhan-xa-cu.png",
      cta: "Chọn Quà Tặng",
      href: "/san-pham",
      bgColor: "from-[#f0f7ff] to-[#f6faff]",
      reverse: false,
      imageLayout: "landscape",
    },
  ];

const IMAGE_FRAME_CLASS: Record<ImageLayout, string> = {
  portrait:
    "w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[480px] aspect-[3/4] min-h-[360px] sm:min-h-[420px] lg:min-h-[500px]",
  landscape:
    "w-full max-w-[520px] lg:max-w-[580px] aspect-[5/4] min-h-[300px] sm:min-h-[360px] lg:min-h-[420px]",
  square:
    "w-full max-w-[400px] sm:max-w-[440px] lg:max-w-[500px] aspect-square min-h-[320px] sm:min-h-[380px] lg:min-h-[460px]",
};

export function CollectionShowcase() {
  return (
    <section className="py-4">
      {collections.map((collection) => (
        <div
          key={collection.id}
          className={`bg-gradient-to-br ${collection.bgColor} relative overflow-hidden`}
        >
          <div className="container mx-auto px-4 md:px-6">
            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 xl:gap-20 items-center py-14 md:py-16 lg:py-20 min-h-0 lg:min-h-[560px] ${collection.reverse ? "[&>div:first-child]:lg:order-2 [&>div:last-child]:lg:order-1" : ""
                }`}
            >
              {/* Image — chiếm không gian rõ ràng, không bị nép */}
              <div className="flex justify-center lg:justify-center items-center w-full">
                <div className="relative w-full flex justify-center">
                  <div
                    className="absolute inset-0 max-w-[90%] mx-auto rounded-[2rem] bg-white/50 blur-2xl scale-95"
                    aria-hidden
                  />
                  <div
                    className={`relative rounded-3xl bg-white border border-[#E8D8C3]/50 shadow-[0_20px_60px_-15px_rgba(11,37,69,0.12)] overflow-hidden ${IMAGE_FRAME_CLASS[collection.imageLayout]}`}
                  >
                    <Image
                      src={collection.image}
                      alt={collection.title}
                      fill
                      className="object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.02]"
                      sizes="(max-width: 1024px) 90vw, 45vw"
                      priority={collection.id <= 2}
                    />
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="w-full text-center lg:text-left flex flex-col justify-center px-2 lg:px-4">
                <span className="text-[10px] font-bold tracking-[0.35em] text-[#1b2a4a] uppercase mb-3 block">
                  {collection.subtitle}
                </span>
                <h3 className="text-3xl md:text-4xl lg:text-[2.75rem] font-serif text-[#0B2545] mb-5 leading-[1.15]">
                  {collection.title}
                </h3>
                <p className="text-[#0B2545]/65 text-sm md:text-base mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  {collection.description}
                </p>
                <div className="flex justify-center lg:justify-start">
                  <Link
                    href={collection.href}
                    className="inline-flex items-center justify-center border border-[#1b2a4a] text-[#1b2a4a] hover:bg-[#1b2a4a] hover:text-white px-8 py-3.5 text-xs tracking-wider uppercase rounded-full group transition-all duration-300 bg-transparent"
                  >
                    {collection.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
