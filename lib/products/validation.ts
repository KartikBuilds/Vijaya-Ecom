import { Prisma, ProductStatus } from "@prisma/client";
import { z } from "zod";
import { validateScheduleWindow } from "@/lib/content/visibility";

const optionalText = (maximum: number) => z.string().trim().max(maximum).transform((value) => value || null);
const optionalDate = z.string().trim().refine((value) => !value || !Number.isNaN(Date.parse(value)), "Enter a valid date.").transform((value) => value ? new Date(value) : null);
const money = z.string().trim().refine((value) => value === "" || /^-?\d+(\.\d{1,2})?$/.test(value), "Enter a valid amount with up to 2 decimal places.");
const imageValue = z.string().trim().min(1, "Product image is required.").max(2048).refine((value) => {
  if (value.startsWith("/")) return !value.startsWith("//") && !value.includes("\\");
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}, "Use a local /assets path or a valid HTTP(S) image URL.");

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(120),
  slug: z.string().trim().min(1, "Slug is required.").max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  categoryId: z.string().trim().min(1, "Choose a valid category."),
  shortDescription: optionalText(300),
  description: optionalText(10000),
  imagePath: imageValue,
  price: money,
  compareAtPrice: money,
  preparationTime: optionalText(100),
  servings: optionalText(100),
  status: z.nativeEnum(ProductStatus),
  pinned: z.boolean(),
  featured: z.boolean(),
  preorder: z.boolean(),
  preorderMessage: optionalText(300),
  expectedDispatch: optionalText(120),
  publishAt: optionalDate,
  unpublishAt: optionalDate,
  sortOrder: z.coerce.number().int("Sort order must be a whole number.").min(-9999).max(9999),
  seoTitle: optionalText(200),
  seoDescription: optionalText(600),
}).superRefine((value, context) => {
  if (value.price && new Prisma.Decimal(value.price).isNegative()) context.addIssue({ code: "custom", path: ["price"], message: "Price cannot be negative." });
  if (value.compareAtPrice && new Prisma.Decimal(value.compareAtPrice).isNegative()) context.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Compare-at price cannot be negative." });
  if (value.price && value.compareAtPrice && new Prisma.Decimal(value.compareAtPrice).lessThan(new Prisma.Decimal(value.price))) context.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Compare-at price must be greater than or equal to price." });
  for (const issue of validateScheduleWindow(value)) context.addIssue({ code: "custom", path: [issue.path], message: issue.message });
});

export type ProductInput = {
  name: string; slug: string; categoryId: string; shortDescription: string | null; description: string | null;
  imagePath: string; price: Prisma.Decimal | null; compareAtPrice: Prisma.Decimal | null; preparationTime: string | null;
  servings: string | null; status: ProductStatus; pinned: boolean; featured: boolean; preorder: boolean; preorderMessage: string | null;
  expectedDispatch: string | null; publishAt: Date | null; unpublishAt: Date | null; sortOrder: number;
  seoTitle: string | null; seoDescription: string | null;
};
export type ProductFormState = { message?: string; errors?: Record<string, string[]> };

export function validateProductForm(formData: FormData): { success: true; data: ProductInput } | { success: false; state: ProductFormState } {
  const parsed = productFormSchema.safeParse({
    name: formData.get("name"), slug: formData.get("slug"), categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription") ?? "", description: formData.get("description") ?? "",
    imagePath: formData.get("imagePath"), price: formData.get("price") ?? "", compareAtPrice: formData.get("compareAtPrice") ?? "",
    preparationTime: formData.get("preparationTime") ?? "", servings: formData.get("servings") ?? "", status: formData.get("status"),
    pinned: formData.get("pinned") === "on", featured: formData.get("featured") === "on", preorder: formData.get("preorder") === "on",
    preorderMessage: formData.get("preorderMessage") ?? "", expectedDispatch: formData.get("expectedDispatch") ?? "",
    publishAt: formData.get("publishAt") ?? "", unpublishAt: formData.get("unpublishAt") ?? "", sortOrder: formData.get("sortOrder") ?? "0",
    seoTitle: formData.get("seoTitle") ?? "", seoDescription: formData.get("seoDescription") ?? "",
  });
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) { const field = String(issue.path[0] ?? "form"); (errors[field] ??= []).push(issue.message); }
    return { success: false, state: { message: "Review the highlighted fields.", errors } };
  }
  const { price, compareAtPrice, ...rest } = parsed.data;
  return { success: true, data: { ...rest, price: price ? new Prisma.Decimal(price) : null, compareAtPrice: compareAtPrice ? new Prisma.Decimal(compareAtPrice) : null } };
}
