import "server-only";
import { ProductStatus, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { PublicProduct } from "./public-types";
import { publicScheduleWhere } from "@/lib/content/visibility";

const publicProductSelect = {
  id: true, name: true, slug: true, shortDescription: true, description: true,
  imagePath: true, price: true, compareAtPrice: true, preparationTime: true,
  servings: true, featured: true, preorder: true, sortOrder: true,
  seoTitle: true, seoDescription: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

type ProductRecord = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;
const serialize = (product: ProductRecord): PublicProduct => ({
  ...product,
  price: product.price?.toString() ?? null,
  compareAtPrice: product.compareAtPrice?.toString() ?? null,
});

export async function getPublishedProducts() {
  const products = await db.product.findMany({
    where: { status: ProductStatus.PUBLISHED, ...publicScheduleWhere() }, select: publicProductSelect,
    orderBy: [{ pinned: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return products.map(serialize);
}

export async function getPublishedProductBySlug(slug: string) {
  const product = await db.product.findFirst({ where: { slug, status: ProductStatus.PUBLISHED, ...publicScheduleWhere() }, select: publicProductSelect });
  return product ? serialize(product) : null;
}
