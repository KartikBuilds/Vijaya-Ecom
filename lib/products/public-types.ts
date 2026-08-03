export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  category: { id: string; name: string; slug: string };
  imagePath: string;
  price: string | null;
  compareAtPrice: string | null;
  preparationTime: string | null;
  servings: string | null;
  featured: boolean;
  preorder: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
}

export type ProductFilter = "all" | "veg" | "non-veg" | "chicken" | "fish" | "gravy";

const normalizeSearch = (value: string) => value.trim().toLowerCase().replace(/\bkadai\b/g, "kadhai");

export function matchesProduct(product: PublicProduct, filter: ProductFilter, query: string) {
  const haystack = normalizeSearch([
    product.name, product.slug, product.shortDescription, product.description,
    product.category.name, product.category.slug,
  ].filter(Boolean).join(" "));
  const categorySlug = product.category.slug.toLowerCase();
  const filterMatches = filter === "all"
    || (filter === "veg" && categorySlug === "veg")
    || (filter === "non-veg" && categorySlug === "non-veg")
    || haystack.includes(filter);
  const normalizedQuery = normalizeSearch(query);
  return filterMatches && (!normalizedQuery || haystack.includes(normalizedQuery));
}

export function formatProductPrice(value: string | null) {
  if (value === null) return "Price on request";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value));
}
