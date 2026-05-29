import type { MenuGroup } from "./menuGroups";

/** Fallback khi danh mục cũ chưa có menuGroup trong DB */
export const SLUG_MENU_MAP: Record<string, MenuGroup> = {
  nhan: "TRANG_SUC",
  "khuyen-tai": "TRANG_SUC",
  "vong-co": "TRANG_SUC",
  "lac-tay": "TRANG_SUC",
  luoc: "PHU_KIEN",
  "cham-cai-toc": "PHU_KIEN",
  "guong-cam-tay": "PHU_KIEN",
  "qua-sinh-nhat": "QUA_TANG",
  "qua-ky-niem": "QUA_TANG",
};

export function resolveCategoryMenuGroup(
  category: { slug?: string; menuGroup?: MenuGroup; name?: string }
): MenuGroup | undefined {
  if (category.menuGroup) return category.menuGroup;

  if (category.slug && SLUG_MENU_MAP[category.slug]) {
    return SLUG_MENU_MAP[category.slug];
  }

  const name = (category.name || "").toLowerCase();
  if (/nhẫn|khuyên|vòng|lắc|dây chuyền|trang sức/.test(name)) return "TRANG_SUC";
  if (/lược|trâm|phụ kiện|gương|móc khóa/.test(name)) return "PHU_KIEN";
  if (/quà|sinh nhật|kỷ niệm/.test(name)) return "QUA_TANG";

  return undefined;
}
