/**
 * Ảnh minh họa câu chuyện — chủ đề xà cừ, vỏ trai, khảm thủ công (Unsplash).
 * next.config đã cho phép images.unsplash.com
 */
export const STORY_IMAGES = {
  /** Ảnh lớn: vỏ abalone / xà cừ — ánh ngũ sắc */
  hero: {
    src: "https://images.unsplash.com/photo-1759680239559-b15010f8a7a8?w=1400&q=85&auto=format&fit=crop",
    alt: "Vỏ xà cừ (abalone) với họa tiết xanh lam ngũ sắc — nguyên liệu khảm trai",
    label: "Nguyên liệu xà cừ",
    sublabel: "Sắc ánh độc bản từ đại dương",
  },
  /** Ảnh phụ 1: bề mặt ngọc trai / vỏ — texture khảm */
  shellTexture: {
    src: "https://images.unsplash.com/photo-1541752504161-f5c7d409ab0b?w=800&q=85&auto=format&fit=crop",
    alt: "Cận cảnh bề mặt ngọc trai, vân xà cừ óng ánh",
    label: "Vân xà cừ óng ánh",
  },
  /** Ảnh phụ 2: hạt ngọc / nguyên liệu chế tác */
  craftsmanship: {
    src: "https://images.unsplash.com/photo-1707463863507-da53ca6e2f52?w=800&q=85&auto=format&fit=crop",
    alt: "Nguyên liệu trang sức — hạt ngọc, chi tiết thủ công",
    label: "Chế tác thủ công",
  },
  /** Hàng dưới trái: trang sức thành phẩm */
  finishedArt: {
    src: "https://images.unsplash.com/photo-1709737449381-ea4720ce8fc8?w=900&q=85&auto=format&fit=crop",
    alt: "Trang sức mỹ nghệ — sản phẩm xà cừ, khảm trai tinh xảo",
    label: "Trang sức khảm trai",
  },
  /** Hàng dưới phải: sắc màu xà cừ — minh họa ghép khảm */
  inlayDetail: {
    src: "https://images.unsplash.com/photo-1754343561258-6c1d6e915455?w=900&q=85&auto=format&fit=crop",
    alt: "Sắc xanh lam ngũ sắc đặc trưng của lớp xà cừ khi khảm ghép",
    label: "Ghép khảm tỉ mỉ",
  },
} as const;
