import { MapPin, Phone, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StoreInfo() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif text-[#333] mb-3">Hệ Thống Cửa Hàng</h2>
          <div className="w-16 h-0.5 bg-[#2e4c7e] mx-auto mb-4" />
          <p className="text-[#777] text-sm max-w-md mx-auto">
            Ghé thăm showroom để trải nghiệm trực tiếp các bộ sưu tập trang sức cao cấp
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Store Hours */}
          <div className="bg-[#faf8f6] rounded-2xl p-8 text-center hover:shadow-lg transition-shadow duration-300 group border border-[#e2e8f0]">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#2e4c7e] mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#333] mb-4">Giờ Làm Việc</h3>
            <div className="space-y-2 text-sm text-[#777]">
              <p>Thứ 2 - Thứ 6: 9:00 - 20:00</p>
              <p>Thứ 7: 9:00 - 21:00</p>
              <p>Chủ Nhật: 10:00 - 18:00</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-[#faf8f6] rounded-2xl p-8 text-center hover:shadow-lg transition-shadow duration-300 group border border-[#e2e8f0]">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#2e4c7e] mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#333] mb-4">Showroom Chính</h3>
            <div className="space-y-2 text-sm text-[#777] mb-6">
              {/* <p>123 Khu Giáo dục và Đào tạo - Khu Công nghệ cao Hòa Lạc</p> */}
              <p>Thôn 2, Phú Bình, Phú Cát, TP. Hà Nội</p>
              <p>Việt Nam</p>
            </div>
            <a
              href="https://maps.app.goo.gl/geottyxoxSdjDNox6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 border border-[#2e4c7e] text-[#2e4c7e] hover:bg-[#2e4c7e] hover:text-white text-xs px-6 rounded-full transition-colors font-medium"
            >
              Chỉ Đường
            </a>
          </div>

          {/* Contact */}
          <div className="bg-[#faf8f6] rounded-2xl p-8 text-center hover:shadow-lg transition-shadow duration-300 group border border-[#e2e8f0]">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#2e4c7e] mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-[#333] mb-4">Liên Hệ</h3>
            <div className="space-y-3 text-sm text-[#777]">
              <p className="flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 text-[#2e4c7e]" /> 0965491328
              </p>
              <p className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4 text-[#2e4c7e]" /> info@khamhoa.vn
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
