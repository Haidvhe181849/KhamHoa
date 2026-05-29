"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Send,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BRAND = {
  name: "KHẢM HOA",
  tagline: "Tinh Hoa Nghệ Thuật Khảm Đương Đại",
  description:
    "Mang nghệ thuật khảm trai truyền thống vào những thiết kế hiện đại, tinh tế và giàu giá trị văn hóa.",
  hotline: "0965491328",
  email: "khamhoa@gmail.com",
  website: "www.khamhoa.store",
  address: "Thôn 2, Phú Bình, Phú Cát, TP. Hà Nội",
};

const QUICK_LINKS = [
  { label: "Trang Chủ", href: "/" },
  { label: "Sản Phẩm", href: "/san-pham" },
  { label: "Về Chúng Tôi", href: "/gioi-thieu" },
];

const SUPPORT_LINKS = [
  { label: "Giỏ Hàng", href: "/gio-hang" },
  { label: "Hồ Sơ Cá Nhân", href: "/account/profile" },
  { label: "Lịch Sử Đơn Hàng", href: "/account/orders" },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61590438808344", icon: FaFacebook },
  { label: "Instagram", href: "#", icon: FaInstagram },
  { label: "TikTok", href: "#", icon: FaTiktok },
];

const PAYMENT_METHODS = ["Visa", "Mastercard", "MoMo", "COD", "Chuyển khoản"];

function FooterLinkList({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-serif text-base md:text-lg text-white tracking-wide mb-5 relative inline-block">
        {title}
        <span className="absolute -bottom-2 left-0 w-8 h-px bg-gradient-to-r from-[#c9a15c] to-transparent" />
      </h4>
      <ul className="space-y-3 mt-6">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-white/70 hover:text-white hover:pl-1 transition-all duration-300 inline-block"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-[#1b2a4a] bg-[#1b2a4a] overflow-hidden">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2e4c7e] via-50% to-transparent"
        aria-hidden
      />

      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8 relative">
        {/* Main 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 mb-14">
          {/* Section 1 — Brand */}
          <div className="sm:col-span-2 lg:col-span-6 space-y-5">
            <Link href="/" className="inline-block group">
              <span className="font-serif text-2xl md:text-3xl tracking-[0.2em] text-white block group-hover:text-white/80 transition-colors">
                {BRAND.name}
              </span>
              <span className="text-[10px] uppercase tracking-[0.35em] text-white/50 mt-1 block">
                {BRAND.tagline}
              </span>
            </Link>

            <p className="text-sm text-white/70 leading-relaxed max-w-sm">
              {BRAND.description}
            </p>

            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${BRAND.hotline.replace(/\s/g, "")}`}
                  className="flex items-start gap-3 text-white/70 hover:text-white transition-colors group"
                >
                  <Phone className="w-4 h-4 shrink-0 mt-0.5 text-white/50 group-hover:text-white transition-colors" />
                  <span>
                    <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                      Hotline
                    </span>
                    {BRAND.hotline}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="flex items-start gap-3 text-white/70 hover:text-white transition-colors group"
                >
                  <Mail className="w-4 h-4 shrink-0 mt-0.5 text-white/50 group-hover:text-white transition-colors" />
                  <span>
                    <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                      Email
                    </span>
                    {BRAND.email}
                  </span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/70">
                <Globe className="w-4 h-4 shrink-0 mt-0.5 text-white/50" />
                <span>
                  <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                    Website
                  </span>
                  {BRAND.website}
                </span>
              </li>
              <li className="flex items-start gap-3 text-white/70">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-white/50" />
                <span>
                  <span className="text-[10px] uppercase tracking-wider text-white/50 block">
                    Showroom
                  </span>
                  {BRAND.address}
                </span>
              </li>
            </ul>

            <div className="flex gap-2.5 pt-1">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-white/20 bg-transparent flex items-center justify-center text-white/70 hover:bg-white hover:text-[#1b2a4a] hover:border-white transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Section 2 — Khám phá */}
          <div className="lg:col-span-3">
            <FooterLinkList title="Liên Kết Nhanh" links={QUICK_LINKS} />
          </div>

          {/* Section 3 — Hỗ trợ */}
          <div className="lg:col-span-3">
            <FooterLinkList title="Hỗ Trợ Khách Hàng" links={SUPPORT_LINKS} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 mt-12">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <p className="text-xs text-white/50 text-center lg:text-left order-2 lg:order-1">
              &copy; {new Date().getFullYear()} Khảm Hoa — Mỹ nghệ khảm trai Việt Nam. Bảo lưu
              mọi quyền.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 order-1 lg:order-2">
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white/70 bg-white/5 border border-white/10"
                >
                  {method === "Visa" || method === "Mastercard" ? (
                    <CreditCard className="w-3 h-3 opacity-60" />
                  ) : method === "MoMo" ? (
                    <Smartphone className="w-3 h-3 opacity-60" />
                  ) : null}
                  {method}
                </span>
              ))}
            </div>

            <div className="flex gap-2 order-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={`bottom-${label}`}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
