"use client";

import { useEffect, useState } from "react";
import { Ticket, Copy, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";

interface VoucherType {
  _id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  expiryDate: string;
  description?: string;
  isActive: boolean;
}

const fallbackVouchers: VoucherType[] = [
  {
    _id: "v-1",
    code: "KHAMHOA1/06",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderValue: 200000,
    expiryDate: "2026-06-30T23:59:59.000Z",
    description: "Giảm 20% cho mọi đơn hàng từ 200k nhân dịp ra mắt bộ sưu tập mới",
    isActive: true
  },
  {
    _id: "v-2",
    code: "FREESHIP",
    discountType: "FIXED",
    discountValue: 30000,
    minOrderValue: 500000,
    expiryDate: "2026-12-31T23:59:59.000Z",
    description: "Miễn phí vận chuyển 30k cho các đơn hàng từ 500k toàn quốc",
    isActive: true
  }
];

export function VoucherList() {
  const [vouchers, setVouchers] = useState<VoucherType[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 12, minutes: 45, seconds: 30 });
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/vouchers`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          // Chỉ lấy các voucher đang kích hoạt (isActive === true) và chưa hết hạn
          const activeVouchers = data.data.filter((v: any) => v.isActive !== false);
          setVouchers(activeVouchers);
        }
        setHasLoaded(true);
      })
      .catch((err) => {
        console.error("Error fetching vouchers:", err);
        setHasLoaded(true);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Nếu chưa tải xong hoặc không có voucher nào, không hiển thị phần này (giữ website gọn gàng, cao cấp)
  if (!hasLoaded || vouchers.length === 0) {
    return null;
  }

  const list = vouchers;

  return (
    <section className="py-12 md:py-16 bg-[#e0f0ff]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="text-[#2e4c7e] text-xs font-bold tracking-[0.2em] uppercase mb-2 block">
            QUÀ TẶNG ƯU ĐÃI
          </span>
          <h2 className="text-2xl md:text-3xl font-serif text-[#333] mb-3">Ưu Đãi & Mã Giảm Giá Độc Quyền</h2>
          <div className="w-16 h-0.5 bg-[#2e4c7e] mx-auto mb-4" />
          <p className="text-[#777] text-sm max-w-md mx-auto">
            Lưu ngay các mã giảm giá và đừng bỏ lỡ các ưu đãi đặc biệt để mua sắm các sản phẩm trang sức khảm xà cừ cao cấp.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-12">
          {/* Top: Promo Campaign Banner */}
          <div className="relative bg-gradient-to-r from-[#e2e8f0] via-[#faf8f6] to-[#e6f0fa] rounded-3xl overflow-hidden min-h-[350px] shadow-sm border border-[#e8d8c3]/30">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-[#2e4c7e]/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#e8d8c3]/20 rounded-full -ml-10 -mb-10 blur-2xl" />

            <div className="relative flex flex-col lg:flex-row items-center h-full p-8 md:p-12 gap-8">
              {/* Left Content */}
              <div className="w-full lg:w-1/2 text-center lg:text-left z-10">
                <span className="inline-block text-[#2e4c7e] text-[10px] font-bold tracking-[0.3em] uppercase mb-3 bg-white/70 px-3 py-1.5 rounded-full">
                  SỐ LƯỢNG CÓ HẠN
                </span>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-serif text-[#333] leading-tight mb-4">
                  Tôn Vinh Di Sản<br />
                  <span className="text-[#2e4c7e]">Ưu Đãi Độc Quyền</span>
                </h3>
                <p className="text-[#777] text-sm md:text-base mb-6 max-w-sm mx-auto lg:mx-0">
                  Đón nhận ưu đãi đặc quyền cho các tuyệt tác khảm xà cừ thủ công cao cấp. Chạm tay vào di sản văn hóa truyền thống tinh tế.
                </p>

                {/* Countdown */}
                <div className="flex gap-3 mb-8 justify-center lg:justify-start">
                  {[
                    { value: timeLeft.days, label: "Ngày" },
                    { value: timeLeft.hours, label: "Giờ" },
                    { value: timeLeft.minutes, label: "Phút" },
                    { value: timeLeft.seconds, label: "Giây" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl shadow-sm px-3 py-2 md:px-4 md:py-3 text-center min-w-[50px] md:min-w-[60px]">
                      <div className="text-lg md:text-xl font-bold text-[#2e4c7e]">
                        {String(item.value).padStart(2, "0")}
                      </div>
                      <div className="text-[8px] md:text-[9px] text-[#999] uppercase tracking-wider mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>

                <Link href="/san-pham" passHref>
                  <Button className="bg-[#2e4c7e] hover:bg-[#1b2a4a] text-white px-8 md:px-10 py-5 md:py-6 text-xs md:text-sm tracking-wider shadow-lg shadow-[#2e4c7e]/30 transition-all hover:-translate-y-0.5">
                    Khám Phá Ngay
                  </Button>
                </Link>
              </div>

              {/* Right Image */}
              <div className="w-full lg:w-1/2 flex justify-center relative">
                <div className="relative w-[220px] h-[220px] md:w-[280px] md:h-[280px] lg:w-[320px] lg:h-[320px]">
                  <div className="absolute inset-0 rounded-full bg-white/60 blur-2xl" />
                  <Image
                    src="/images/products/day-chuyen-xa-cu.png"
                    alt="Premium handcrafted mother of pearl jewelry promotion"
                    fill
                    className="object-contain drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-700"
                  />
                </div>
                {/* Price tag */}
                <div className="absolute bottom-4 right-4 lg:bottom-8 lg:right-8 bg-white rounded-2xl shadow-xl px-4 py-2.5 md:px-5 md:py-3 z-20 border border-[#eef2f6]/50">
                  <span className="text-[10px] md:text-xs text-[#999] line-through block">2.250.000₫</span>
                  <span className="text-lg md:text-xl font-bold text-[#2e4c7e]">1.499.000₫</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Voucher Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {list.map((v) => {
              const isPercentage = v.discountType === "PERCENTAGE";
              const discountDisplay = isPercentage
                ? `${v.discountValue}%`
                : `${(v.discountValue / 1000).toFixed(0)}K`;

              const expiry = new Date(v.expiryDate).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              });

              return (
                <div
                  key={v._id}
                  className="bg-white rounded-2xl border border-[#e8d8c3]/40 shadow-sm hover:shadow-md transition-all duration-300 flex overflow-hidden group relative"
                >
                  {/* Left Side Tag */}
                  <div className="bg-gradient-to-br from-[#1f3a63] to-[#2e4c7e] text-white flex flex-col justify-center items-center w-24 md:w-28 text-center px-2 shrink-0 relative">
                    <div className="absolute top-0 bottom-0 left-[-4px] flex flex-col justify-around text-white/40 pointer-events-none select-none">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-[#faf8f6]" />
                      ))}
                    </div>
                    <Ticket className="w-6 h-6 mb-2 opacity-90" />
                    <div className="text-lg md:text-xl font-bold tracking-tight">{discountDisplay}</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-85">GIẢM</div>
                  </div>

                  {/* Right Side details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="text-[#333] font-mono font-bold text-sm bg-[#faf8f6]/60 px-2 py-0.5 rounded border border-[#2e4c7e]/20">
                          {v.code}
                        </span>
                        <span className="text-[10px] text-[#999] font-medium">Hạn dùng: {expiry}</span>
                      </div>
                      <p className="text-xs text-[#777] font-medium leading-relaxed min-h-[36px]">
                        {v.description || `Giảm ngay ${discountDisplay} cho đơn hàng từ ${v.minOrderValue.toLocaleString("vi-VN")}₫`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0] mt-2">
                      <div className="text-[10px] text-[#aaa]">
                        Đơn tối thiểu: <span className="font-semibold text-[#888]">{v.minOrderValue.toLocaleString("vi-VN")}₫</span>
                      </div>
                      <button
                        onClick={() => handleCopy(v.code)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${copiedCode === v.code
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-[#0B2545] text-white hover:bg-[#1f3a63] shadow-sm shadow-[#0B2545]/10 hover:scale-[1.03]"
                          }`}
                      >
                        {copiedCode === v.code ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Đã sao chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Sao chép mã
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
