import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-20 bg-[#FAFAFA]">
      <div className="relative flex items-center justify-center">
        {/* Vòng nền */}
        <div className="w-16 h-16 border-4 border-[#eef2f6] rounded-full"></div>
        {/* Vòng xoay */}
        <div className="w-16 h-16 border-4 border-[#2e4c7e] rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        {/* Icon nhỏ ở giữa */}
        <div className="absolute text-[#2e4c7e]/50">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
      <p className="mt-8 text-[#2e4c7e] font-serif font-medium tracking-[0.2em] uppercase text-sm animate-pulse">
        Đang tải dữ liệu...
      </p>
    </div>
  );
}
