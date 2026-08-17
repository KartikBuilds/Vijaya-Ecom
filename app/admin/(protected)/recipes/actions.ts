"use server";

import { Prisma, RecipeStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { validateRecipe, type RecipeState } from "@/lib/recipes/validation";

const refresh = () => {
  revalidatePath("/admin");
  revalidatePath("/admin/recipes");
  revalidatePath("/recipes");
  revalidatePath("/recipes/[slug]", "page");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
};

async function productOk(id: string | null) {
  return !id || Boolean(await db.product.findUnique({ where: { id }, select: { id: true } }));
}

export async function createRecipe(_: RecipeState, form: FormData): Promise<RecipeState> {
  const { user } = await requirePermission("recipes:write");
  const result = validateRecipe(form);
  if (!result.success) return result.state;
  if (!await productOk(result.data.productId)) return { message: "Choose a valid product." };
  try {
    const recipe = await db.recipe.create({ data: result.data });
    await writeAuditLog({ adminId: user.id, action: "RECIPE_CREATED", entityType: "Recipe", entityId: recipe.id, summary: `${user.displayName ?? user.username ?? user.email} created ${recipe.title}.` });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { message: "A recipe with this slug already exists.", errors: { slug: ["Slug is already in use."] } };
    return { message: "Recipe could not be saved." };
  }
  refresh();
  redirect("/admin/recipes?success=created");
}

export async function updateRecipe(id: string, _: RecipeState, form: FormData): Promise<RecipeState> {
  const { user } = await requirePermission("recipes:write");
  const result = validateRecipe(form);
  if (!result.success) return result.state;
  if (!await productOk(result.data.productId)) return { message: "Choose a valid product." };
  try {
    const recipe = await db.recipe.update({ where: { id }, data: result.data });
    await writeAuditLog({ adminId: user.id, action: "RECIPE_UPDATED", entityType: "Recipe", entityId: recipe.id, summary: `${user.displayName ?? user.username ?? user.email} updated ${recipe.title}.` });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { message: "Slug is already in use." };
    return { message: "Recipe could not be saved." };
  }
  refresh();
  redirect("/admin/recipes?success=updated");
}

export async function archiveRecipe(form: FormData) {
  const { user } = await requirePermission("recipes:write");
  const id = String(form.get("id") ?? "");
  await db.recipe.updateMany({ where: { id, status: { not: RecipeStatus.ARCHIVED } }, data: { status: RecipeStatus.ARCHIVED } });
  await writeAuditLog({ adminId: user.id, action: "RECIPE_ARCHIVED", entityType: "Recipe", entityId: id, summary: `${user.displayName ?? user.username ?? user.email} archived a recipe.` });
  refresh();
  redirect("/admin/recipes?success=archived");
}

export async function restoreRecipe(form: FormData) {
  const { user } = await requirePermission("recipes:write");
  const id = String(form.get("id") ?? "");
  await db.recipe.updateMany({ where: { id, status: RecipeStatus.ARCHIVED }, data: { status: RecipeStatus.DRAFT } });
  await writeAuditLog({ adminId: user.id, action: "RECIPE_RESTORED", entityType: "Recipe", entityId: id, summary: `${user.displayName ?? user.username ?? user.email} restored a recipe to draft.` });
  refresh();
  redirect("/admin/recipes?status=archived&success=restored");
}
