export type MenuGroup = "TRANG_SUC" | "PHU_KIEN" | "QUA_TANG";

export const MENU_GROUP_ORDER: MenuGroup[] = [
  "TRANG_SUC",
  "PHU_KIEN",
  "QUA_TANG",
];

export const MENU_GROUP_LABELS: Record<MenuGroup, string> = {
  TRANG_SUC: "Trang Sức",
  PHU_KIEN: "Phụ Kiện",
  QUA_TANG: "Quà Tặng",
};

export interface CategoryMenuItem {
  _id: string;
  name: string;
  slug: string;
  menuGroup: MenuGroup;
  displayOrder?: number;
  showInMenu?: boolean;
}

export interface MegaMenuSection {
  title: string;
  links: { name: string; href: string }[];
}

export function buildMegaMenuSections(
  categories: CategoryMenuItem[],
  labels: Record<string, string> = MENU_GROUP_LABELS
): MegaMenuSection[] {
  return MENU_GROUP_ORDER.map((group) => ({
    title: labels[group] || MENU_GROUP_LABELS[group],
    links: categories
      .filter((c) => c.menuGroup === group && c.showInMenu !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((c) => ({
        name: c.name,
        href: `/danh-muc/${c.slug}`,
      })),
  }));
}
