export interface ProductListItem {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  rating: number;
  reviews: number;
  image: string;
  hoverImage: string;
  slug: string;
  sold: number;
  categoryName?: string;
  categorySlug?: string;
  menuGroup?: string;
}

export function mapProductFromApi(p: {
  _id: string;
  name: string;
  price: number;
  sold?: number;
  slug?: string;
  images?: Array<{ url: string }>;
  categoryId?: { name?: string; slug?: string; menuGroup?: string } | null;
}): ProductListItem {
  const img0 = p.images?.[0]?.url || "/images/products/ring-1.png";
  const img1 = p.images?.[1]?.url || img0;

  return {
    id: p._id,
    name: p.name,
    price: p.price,
    formattedPrice: p.price.toLocaleString("vi-VN") + "₫",
    rating: 5,
    reviews: p.sold && p.sold > 0 ? Math.round(p.sold * 0.4) : 12,
    image: img0,
    hoverImage: img1,
    slug: p.slug || p._id,
    sold: p.sold || 0,
    categoryName: p.categoryId?.name,
    categorySlug: p.categoryId?.slug,
    menuGroup: p.categoryId?.menuGroup,
  };
}

export function sortToApiParam(sortOption: string): string {
  switch (sortOption) {
    case "price-asc":
      return "price";
    case "price-desc":
      return "-price";
    case "newest":
      return "-createdAt";
    case "best-seller":
    default:
      return "-sold";
  }
}
