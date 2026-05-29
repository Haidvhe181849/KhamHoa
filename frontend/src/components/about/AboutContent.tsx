"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw, Truck, Sparkles, ChevronRight } from "lucide-react";
import { AboutStorySection } from "@/components/about/AboutStorySection";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StoreInfo } from "@/components/home/StoreInfo";
import { API_BASE_URL } from "@/lib/api";
import {
  ABOUT_SECTIONS,
  FALLBACK_INTROS,
  mergeIntrosFromApi,
  type IntroContent,
} from "@/lib/about";

const SECTION_ICONS = {
  return: RefreshCw,
  shipping: Truck,
  maintenance: Sparkles,
} as const;

function ProseHtml({ html }: { html: string }) {
  return (
    <div
      className="about-prose text-sm md:text-[15px] text-[#555] leading-relaxed space-y-3
        [&_p]:leading-relaxed [&_strong]:text-[#333] [&_strong]:font-semibold
        [&_ul]:list-none [&_ul]:space-y-3 [&_li]:pl-5 [&_li]:relative
        [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-2
        [&_li]:before:w-1.5 [&_li]:before:h-1.5 [&_li]:before:rounded-full [&_li]:before:bg-[#2e4c7e]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function AboutContent() {
  const [intros, setIntros] = useState<Record<string, IntroContent>>(() =>
    mergeIntrosFromApi([])
  );
  const [activeSection, setActiveSection] = useState<string>(ABOUT_SECTIONS[0].id);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/intros`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length) {
          setIntros(mergeIntrosFromApi(data.data));
        }
      })
      .catch(() => setIntros(mergeIntrosFromApi(FALLBACK_INTROS)));
  }, []);

  useEffect(() => {
    const ids = ABOUT_SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#faf8f6] pt-24">
      <Navbar />

      <main className="flex-1">
        {/* Header compact */}
        <section className="bg-white border-b border-[#e2e8f0] py-6">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="text-[11px] uppercase tracking-wider text-[#999] mb-2 flex justify-center gap-2">
              <Link href="/" className="hover:text-[#2e4c7e] transition-colors">
                Trang chủ
              </Link>
              <span>/</span>
              <span className="text-[#2e4c7e] font-semibold">Về chúng tôi</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif text-[#333] tracking-wide">
              Khảm Hoa — Tinh Hoa Mỹ Nghệ Việt
            </h1>
            <div className="w-14 h-0.5 bg-[#2e4c7e] mx-auto mt-3" />
          </div>
        </section>

        {/* Sticky section nav */}
        <nav className="sticky top-24 z-20 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide justify-center md:justify-center">
              {ABOUT_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollTo(section.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    activeSection === section.id
                      ? "bg-[#2e4c7e] text-white shadow-md shadow-[#2e4c7e]/20"
                      : "text-[#666] hover:bg-[#eef2f6] hover:text-[#2e4c7e]"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 max-w-5xl py-10 md:py-14 space-y-16 md:space-y-20">
          <AboutStorySection />

          {/* Chính sách cards */}
          {ABOUT_SECTIONS.filter((s) => s.type !== "history").map((section, index) => {
            const data = intros[section.type];
            const Icon = SECTION_ICONS[section.type as keyof typeof SECTION_ICONS];
            const isEven = index % 2 === 0;

            return (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-40"
              >
                <div
                  className={`bg-white rounded-3xl border border-[#e2e8f0] p-8 md:p-10 shadow-sm hover:shadow-md hover:shadow-[#2e4c7e]/5 transition-shadow duration-300 ${
                    isEven ? "" : "md:ml-4"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#eef2f6] to-[#faf8f6] flex items-center justify-center text-[#2e4c7e] border border-[#e8d8c3]/50">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl font-serif text-[#333] mb-4 flex items-center gap-2">
                        {data?.title}
                        <ChevronRight className="w-4 h-4 text-[#2e4c7e] hidden md:block" />
                      </h2>
                      <ProseHtml html={data?.content || ""} />
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

          {/* CTA strip */}
          <section className="rounded-3xl bg-gradient-to-r from-[#2e4c7e] to-[#e8b4ae] p-8 md:p-10 text-center text-white">
            <h3 className="font-serif text-xl md:text-2xl mb-2">Cần tư vấn thêm?</h3>
            <p className="text-sm text-white/90 mb-6 max-w-md mx-auto">
              Đội ngũ Khảm Hoa sẵn sàng hỗ trợ chọn mẫu, bảo quản và chính sách mua hàng.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="tel:0965491328"
                className="inline-flex items-center gap-2 bg-white text-[#2e4c7e] px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#faf8f6] transition-colors"
              >
                Gọi 0965491328
              </a>
              <Link
                href="/san-pham"
                className="inline-flex items-center gap-2 border border-white/80 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Xem sản phẩm
              </Link>
            </div>
          </section>
        </div>

        <StoreInfo />
      </main>

      <Footer />
    </div>
  );
}
