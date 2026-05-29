"use client";

import Image from "next/image";
import { BookOpen, Target, Eye, Gem, Heart, Lightbulb, Leaf } from "lucide-react";
import { STORY_IMAGES } from "@/lib/storyImages";

const CORE_VALUES = [
  {
    title: "Tinh xảo",
    desc: "Mỗi chi tiết được hoàn thiện bằng sự tỉ mỉ và tâm huyết.",
    icon: Gem,
  },
  {
    title: "Chân thực",
    desc: "Tôn trọng giá trị nguyên bản của chất liệu và nghề thủ công truyền thống.",
    icon: Heart,
  },
  {
    title: "Sáng tạo",
    desc: "Kết hợp giữa nghệ thuật truyền thống và xu hướng thiết kế hiện đại.",
    icon: Lightbulb,
  },
  {
    title: "Bền vững",
    desc: "Hỗ trợ cộng đồng nghệ nhân và phát triển các giá trị văn hóa lâu dài.",
    icon: Leaf,
  },
];

const MISSION_ITEMS = [
  "Gìn giữ và phát huy giá trị nghề khảm trai truyền thống Việt Nam.",
  "Kết nối nghệ nhân với khách hàng thông qua nền tảng thương mại điện tử hiện đại.",
  "Mang đến những sản phẩm thủ công chất lượng, độc đáo và giàu giá trị văn hóa.",
];

function StoryImageCard({
  src,
  alt,
  label,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  label: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl group ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#2a2520]/70 via-[#2a2520]/10 to-transparent" />
      <span className="absolute bottom-3 left-3 right-3 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-white/95">
        {label}
      </span>
    </div>
  );
}

export function AboutStorySection() {
  const { hero, shellTexture, craftsmanship, finishedArt, inlayDetail } = STORY_IMAGES;

  return (
    <section id="cau-chuyen" className="scroll-mt-40">
      <div className="bg-white rounded-3xl overflow-hidden border border-[#e2e8f0] shadow-sm shadow-[#2e4c7e]/5">
        {/* Collage — chủ đề xà cừ & khảm trai */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 p-3 md:p-4 bg-[#faf8f6]">
          {/* Ảnh lớn: vỏ xà cừ ngũ sắc */}
          <div className="md:col-span-7 relative aspect-[16/10] md:aspect-auto md:min-h-[340px] rounded-2xl overflow-hidden group">
            <Image
              src={hero.src}
              alt={hero.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              priority
              sizes="(max-width: 768px) 100vw, 58vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1a18]/75 via-[#1f1a18]/15 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#eef2f6] mb-1">
                {hero.label}
              </p>
              <p className="font-serif text-lg md:text-2xl leading-snug">{hero.sublabel}</p>
              <p className="text-xs text-white/75 mt-2 max-w-md hidden sm:block">
                Mỗi mảnh xà cừ mang một sắc màu riêng — không hai sản phẩm giống hệt nhau.
              </p>
            </div>
          </div>

          {/* 2 ảnh phụ */}
          <div className="md:col-span-5 grid grid-rows-2 gap-2 md:gap-3 min-h-[200px] md:min-h-0">
            <StoryImageCard
              src={shellTexture.src}
              alt={shellTexture.alt}
              label={shellTexture.label}
              className="aspect-[4/3] md:aspect-auto md:min-h-[158px]"
            />
            <StoryImageCard
              src={craftsmanship.src}
              alt={craftsmanship.alt}
              label={craftsmanship.label}
              className="aspect-[4/3] md:aspect-auto md:min-h-[158px]"
            />
          </div>

          {/* Hàng dưới */}
          <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <StoryImageCard
              src={finishedArt.src}
              alt={finishedArt.alt}
              label={finishedArt.label}
              className="aspect-[21/9] sm:aspect-[2.4/1] min-h-[120px]"
            />
            <div className="relative aspect-[21/9] sm:aspect-[2.4/1] min-h-[120px] rounded-2xl overflow-hidden">
              <Image
                src={inlayDetail.src}
                alt={inlayDetail.alt}
                fill
                className="object-cover"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-[#2a2520]/55" />
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <p className="text-[10px] uppercase tracking-widest text-[#eef2f6] font-semibold mb-2">
                  {inlayDetail.label}
                </p>
                <p className="text-sm md:text-base text-white font-serif italic leading-relaxed max-w-sm">
                  &ldquo;Mỗi mảnh xà cừ là một sắc màu — mỗi sản phẩm là một câu chuyện.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Story text */}
        <div className="px-6 md:px-10 lg:px-12 py-8 md:py-10 border-t border-[#e2e8f0]">
          <div className="inline-flex items-center gap-2 text-[#2e4c7e] text-xs font-bold uppercase tracking-widest mb-4">
            <BookOpen className="w-4 h-4" />
            Câu chuyện
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-[#333] mb-6">
            Câu Chuyện Khảm Hoa
          </h2>

          <div className="space-y-4 text-sm md:text-[15px] text-[#555] leading-relaxed max-w-3xl">
            <p>
              Khảm Hoa được hình thành từ niềm yêu thích đối với nghệ thuật khảm trai – một nghề
              thủ công truyền thống đã gắn bó với văn hóa Việt Nam qua nhiều thế hệ.
            </p>
            <p>
              Từ những mảnh <strong className="text-[#333]">xà cừ tự nhiên</strong> với sắc ánh ngũ
              sắc đặc trưng, người nghệ nhân tỉ mỉ cắt, ghép và hoàn thiện từng chi tiết để tạo nên
              những sản phẩm mang vẻ đẹp độc đáo và không thể sao chép hoàn toàn. Chúng tôi tin rằng
              mỗi sản phẩm thủ công đều mang trong mình một câu chuyện riêng và giá trị của sự tận
              tâm.
            </p>
            <p>
              Với mong muốn đưa nghệ thuật truyền thống đến gần hơn với cuộc sống hiện đại, Khảm Hoa
              phát triển các dòng sản phẩm trang sức, phụ kiện và quà tặng thủ công mang phong cách
              thanh lịch, tinh tế nhưng vẫn giữ được nét đẹp nguyên bản của chất liệu khảm trai.
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-4 px-4 md:px-8 pb-4">
          <div className="rounded-2xl bg-[#faf8f6] border border-[#e2e8f0] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#2e4c7e] shadow-sm border border-[#e8d8c3]/40">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[#333]">Sứ mệnh</h3>
            </div>
            <ul className="space-y-3">
              {MISSION_ITEMS.map((item) => (
                <li
                  key={item}
                  className="text-sm text-[#555] leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#2e4c7e]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#eef2f6]/60 to-white border border-[#e2e8f0] p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#2e4c7e] shadow-sm border border-[#e8d8c3]/40">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[#333]">Tầm nhìn</h3>
            </div>
            <p className="text-sm text-[#555] leading-relaxed">
              Trở thành thương hiệu hàng đầu trong lĩnh vực sản phẩm thủ công khảm trai tại Việt
              Nam, đồng thời góp phần quảng bá tinh hoa nghề thủ công Việt ra thị trường quốc tế.
            </p>
          </div>
        </div>

        {/* Core values */}
        <div className="px-4 md:px-8 pb-8 md:pb-10">
          <h3 className="font-serif text-lg text-[#333] text-center mb-6">Giá trị cốt lõi</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {CORE_VALUES.map(({ title, desc, icon: Icon }) => (
              <div
                key={title}
                className="rounded-2xl bg-[#faf8f6] border border-[#e2e8f0] p-4 md:p-5 text-center hover:border-[#2e4c7e]/40 hover:shadow-md hover:shadow-[#2e4c7e]/5 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#2e4c7e] mx-auto mb-3 shadow-sm border border-[#e8d8c3]/30">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-sm md:text-base text-[#333] mb-2">{title}</h4>
                <p className="text-[11px] md:text-xs text-[#777] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
