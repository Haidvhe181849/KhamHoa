"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";

const mockTestimonials = [
  {
    _id: "1",
    userId: { name: "Nguyễn Thị Minh Anh", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" },
    comment: "Những sản phẩm trang sức khảm xà cừ từ Khảm Hoa thực sự là tác phẩm nghệ thuật độc bản. Ánh xà cừ óng ánh tự nhiên tạo điểm nhấn thanh lịch hoàn hảo cho mọi set đồ thời trang cao cấp.",
    rating: 5,
  },
  {
    _id: "2",
    userId: { name: "Trần Thị Thanh Hà", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop" },
    comment: "Tôi đã mua nhiều món trang sức tại Kham Hoa. Chất lượng vượt trội, đóng gói sang trọng, dịch vụ hậu mãi tuyệt vời. Sẽ tiếp tục ủng hộ!",
    rating: 5,
  },
  {
    _id: "3",
    userId: { name: "Lê Văn Nam", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
    comment: "Tôi đã chọn chiếc lược và trâm cài khảm xà cừ hoa đào làm quà tặng đối tác nước ngoài. Sự tinh xảo trong từng đường nét thủ công đậm chất Việt đã hoàn toàn chinh phục họ.",
    rating: 5,
  },
];

export function Testimonials() {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));
  const [testimonials, setTestimonials] = useState<any[]>(mockTestimonials);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/reviews/public?limit=6`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setTestimonials(data.data);
        }
      })
      .catch(err => console.error("Error fetching testimonials:", err));
  }, []);

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-[#e1effe] to-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#eef2f6]/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#e8d8c3]/30 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif text-[#333] mb-3">Khách Hàng Nói Gì</h2>
          <div className="w-16 h-0.5 bg-[#2e4c7e] mx-auto mb-4" />
          <p className="text-[#777] text-sm max-w-md mx-auto">
            Hàng nghìn khách hàng đã tin tưởng Kham Hoa cho những khoảnh khắc đặc biệt
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Carousel plugins={[plugin.current]} opts={{ align: "center", loop: true }} className="w-full">
            <CarouselContent>
              {testimonials.map((t) => (
                <CarouselItem key={t._id}>
                  <div className="p-4">
                    <div className="bg-white rounded-3xl shadow-lg shadow-black/5 p-8 md:p-12 text-center relative border border-[#e2e8f0]">
                      {/* Quote Decoration */}
                      <div className="absolute top-6 left-8 text-[#eef2f6] text-7xl font-serif leading-none select-none">
                        &ldquo;
                      </div>

                      <div className="flex justify-center gap-1 mb-6">
                        {[...Array(t.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-[#f59e0b] text-[#f59e0b]" />
                        ))}
                      </div>

                      <p className="text-[#555] text-lg md:text-xl font-serif italic mb-8 relative z-10 leading-relaxed">
                        “{t.comment}”
                      </p>

                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full overflow-hidden mb-3 border-2 border-[#e8d8c3]">
                          <img
                            src={t.userId?.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(t.userId?.name || "K H") + "&background=random"}
                            alt={t.userId?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-serif text-[#333] font-semibold">{t.userId?.name}</h4>
                        <p className="text-xs text-[#2e4c7e] mt-1">Khách hàng Khảm Hoa</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-3 mt-6">
              <CarouselPrevious className="static translate-y-0 w-10 h-10 border-[#2e4c7e] text-[#2e4c7e] hover:bg-[#2e4c7e] hover:text-white" />
              <CarouselNext className="static translate-y-0 w-10 h-10 border-[#2e4c7e] text-[#2e4c7e] hover:bg-[#2e4c7e] hover:text-white" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
