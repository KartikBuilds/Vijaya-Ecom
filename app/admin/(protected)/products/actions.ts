"use server";
import { Prisma, ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { type ProductFormState, validateProductForm } from "@/lib/products/validation";

async function validCategory(categoryId: string) { return Boolean(await db.category.findUnique({ where: { id: categoryId }, select: { id: true } })); }
function duplicateSlug(error: unknown) { return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"; }
function refreshProducts() {
  revalidatePath("/admin"); revalidatePath("/admin/products");
  revalidatePath("/"); revalidatePath("/products"); revalidatePath("/products/[slug]", "page");
  revalidatePath("/recipes"); revalidatePath("/preorder"); revalidatePath("/cart"); revalidatePath("/sitemap.xml");
}

export async function createProduct(_state: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const result = validateProductForm(formData);
  if (!result.success) return result.state;
  if (!await validCategory(result.data.categoryId)) return { message: "Review the highlighted fields.", errors: { categoryId: ["Choose a valid category."] } };
  try { await db.product.create({ data: result.data }); }
  catch (error) { if (duplicateSlug(error)) return { message: "A product with this slug already exists.", errors: { slug: ["Slug is already in use."] } }; console.error("Product creation failed."); return { message: "Product could not be saved. Please try again." }; }
  refreshProducts(); redirect("/admin/products?success=created");
}

export async function updateProduct(id: string, _state: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const result = validateProductForm(formData);
  if (!result.success) return result.state;
  if (!await validCategory(result.data.categoryId)) return { message: "Review the highlighted fields.", errors: { categoryId: ["Choose a valid category."] } };
  try { await db.product.update({ where: { id }, data: result.data }); }
  catch (error) { if (duplicateSlug(error)) return { message: "A product with this slug already exists.", errors: { slug: ["Slug is already in use."] } }; if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return { message: "This product no longer exists." }; console.error("Product update failed."); return { message: "Product could not be saved. Please try again." }; }
  refreshProducts(); revalidatePath(`/admin/products/${id}`); redirect("/admin/products?success=updated");
}

export async function archiveProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  try { if (id) await db.product.updateMany({ where: { id, status: { not: ProductStatus.ARCHIVED } }, data: { status: ProductStatus.ARCHIVED } }); }
  catch { console.error("Product archive failed."); redirect("/admin/products?error=action"); }
  refreshProducts(); redirect("/admin/products?success=archived");
}

export async function restoreProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  try { if (id) await db.product.updateMany({ where: { id, status: ProductStatus.ARCHIVED }, data: { status: ProductStatus.DRAFT } }); }
  catch { console.error("Product restore failed."); redirect("/admin/products?status=archived&error=action"); }
  refreshProducts(); redirect("/admin/products?status=archived&success=restored");
}
