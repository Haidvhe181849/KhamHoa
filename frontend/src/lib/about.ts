export type IntroType = "history" | "return" | "shipping" | "maintenance" | "policy";

export interface IntroContent {
  type: IntroType;
  title: string;
  content: string;
  image?: { url: string };
}

export const ABOUT_SECTIONS = [
  { id: "cau-chuyen", type: "history" as const, label: "Câu Chuyện" },
  { id: "doi-tra", type: "return" as const, label: "Đổi Trả" },
  { id: "van-chuyen", type: "shipping" as const, label: "Vận Chuyển" },
  { id: "bao-quan", type: "maintenance" as const, label: "Bảo Quản" },
] as const;

/** Nội dung mặc định khi API chưa có dữ liệu */
export const FALLBACK_INTROS: IntroContent[] = [
  {
    type: "history",
    title: "Câu Chuyện Khảm Hoa",
    image: {
      url: "https://images.unsplash.com/photo-1759680239559-b15010f8a7a8?w=1200&q=85&auto=format&fit=crop",
    },
    content: `<p>Nội dung câu chuyện hiển thị trên trang Về chúng tôi.</p>`,
  },
  {
    type: "return",
    title: "Chính Sách Đổi Trả",
    content: `
      <ul>
        <li><strong>Thời gian:</strong> Đổi/trả trong vòng <strong>7 ngày</strong> kể từ khi nhận hàng (sản phẩm chưa qua sử dụng).</li>
        <li><strong>Điều kiện:</strong> Còn nguyên tem, hộp, phụ kiện đi kèm; không trầy xước, nứt vỡ do va đập.</li>
        <li><strong>Lỗi sản xuất:</strong> Khảm Hoa hỗ trợ <strong>đổi mới 100%</strong> hoặc hoàn tiền (công ty chịu phí vận chuyển hai chiều).</li>
        <li><strong>Đổi size / mẫu:</strong> Hỗ trợ 1 lần đổi miễn phí trong 7 ngày nếu còn hàng (khách chịu chênh lệch giá nếu có).</li>
        <li><strong>Không áp dụng:</strong> Sản phẩm đặt riêng theo yêu cầu, quà khắc tên đã hoàn tất.</li>
      </ul>
      <p>Liên hệ hotline <strong>1800 6868</strong> hoặc email <strong>info@khamhoa.vn</strong> kèm mã đơn hàng để được hỗ trợ nhanh nhất.</p>
    `,
  },
  {
    type: "shipping",
    title: "Chính Sách Vận Chuyển",
    content: `
      <ul>
        <li><strong>Nội thành TP.HCM & Hà Nội:</strong> Giao trong 1–2 ngày làm việc.</li>
        <li><strong>Tỉnh thành khác:</strong> 2–5 ngày làm việc (đơn vị: GHTK, Viettel Post, J&T).</li>
        <li><strong>Phí ship:</strong> <strong>30.000₫</strong> — <strong>miễn phí</strong> cho đơn từ <strong>500.000₫</strong>.</li>
        <li><strong>Đóng gói:</strong> Hộp quà sang trọng, chống sốc, kèm thẻ bảo hành và hướng dẫn bảo quản.</li>
        <li><strong>Kiểm hàng:</strong> Quý khách được xem và kiểm tra trước khi thanh toán (COD).</li>
      </ul>
      <p>Thời gian giao có thể kéo dài hơn trong dịp lễ Tết hoặc thời tiết xấu — nhân viên sẽ chủ động liên hệ báo trước.</p>
    `,
  },
  {
    type: "maintenance",
    title: "Hỗ Trợ Bảo Quản",
    content: `
      <ul>
        <li>Tránh ánh nắng trực tiếp và nhiệt độ cao lâu ngày.</li>
        <li>Không tiếp xúc nước muối, hóa chất tẩy rửa, nước hoa trực tiếp lên mặt khảm.</li>
        <li>Lau nhẹ bằng khăn mềm, khô hoặc hơi ẩm — không dùng bàn chải cứng.</li>
        <li>Bảo quản riêng trong hộp vải, tránh va đập với kim loại cứng.</li>
        <li>Định kỳ 6 tháng có thể thoa một lớp tinh dầu gỗ mỏng để giữ độ bóng tự nhiên.</li>
      </ul>
      <p>Khảm Hoa cam kết <strong>bảo hành trọn đời</strong> về độ bám mảnh khảm trong điều kiện sử dụng và bảo quản đúng hướng dẫn.</p>
    `,
  },
];

export function mergeIntrosFromApi(apiData: IntroContent[]): Record<string, IntroContent> {
  const map: Record<string, IntroContent> = {};

  FALLBACK_INTROS.forEach((fb) => {
    map[fb.type] = fb;
  });

  apiData.forEach((item) => {
    const key = item.type === "policy" ? "return" : item.type;
    map[key] = { ...map[key], ...item, type: key as IntroType };
  });

  return map;
}
