"use server";

import { Prisma, ReviewStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { type ReviewFormState, validateReviewForm } from "@/lib/reviews/validation";

async function validProduct(id: string | null) {
  return !id || Boolean(await db.product.findUnique({ where: { id }, select: { id: true } }));
}

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidatePath("/products/[slug]", "page");
}

export async function createReview(_state: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const { user } = await requirePermission("reviews:moderate");
  const result = validateReviewForm(formData);
  if (!result.success) return result.state;
  if (!await validProduct(result.data.productId)) return { message: "Choose a valid product.", errors: { productId: ["Choose a valid product."] } };
  try {
    const review = await db.review.create({ data: result.data });
    await writeAuditLog({ adminId: user.id, action: "REVIEW_CREATED", entityType: "Review", entityId: review.id, summary: `${user.displayName ?? user.username ?? user.email} created a review for ${review.customerName}.` });
  } catch {
    console.error("Review creation failed.");
    return { message: "Review could not be saved. Please try again." };
  }
  refresh();
  redirect("/admin/reviews?success=created");
}

export async function updateReview(id: string, _state: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const { user } = await requirePermission("reviews:moderate");
  const result = validateReviewForm(formData);
  if (!result.success) return result.state;
  if (!await validProduct(result.data.productId)) return { message: "Choose a valid product.", errors: { productId: ["Choose a valid product."] } };
  try {
    const review = await db.review.update({ where: { id }, data: result.data });
    await writeAuditLog({ adminId: user.id, action: "REVIEW_UPDATED", entityType: "Review", entityId: review.id, summary: `${user.displayName ?? user.username ?? user.email} updated a review for ${review.customerName}.` });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return { message: "This review no longer exists." };
    console.error("Review update failed.");
    return { message: "Review could not be saved. Please try again." };
  }
  refresh();
  redirect("/admin/reviews?success=updated");
}

export async function archiveReview(formData: FormData) {
  const { user } = await requirePermission("reviews:moderate");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.review.updateMany({ where: { id, status: { not: ReviewStatus.ARCHIVED } }, data: { status: ReviewStatus.ARCHIVED } });
    await writeAuditLog({ adminId: user.id, action: "REVIEW_ARCHIVED", entityType: "Review", entityId: id, summary: `${user.displayName ?? user.username ?? user.email} archived a review.` });
  }
  refresh();
  redirect("/admin/reviews?success=archived");
}

export async function restoreReview(formData: FormData) {
  const { user } = await requirePermission("reviews:moderate");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await db.review.updateMany({ where: { id, status: ReviewStatus.ARCHIVED }, data: { status: ReviewStatus.DRAFT } });
    await writeAuditLog({ adminId: user.id, action: "REVIEW_RESTORED", entityType: "Review", entityId: id, summary: `${user.displayName ?? user.username ?? user.email} restored a review to draft.` });
  }
  refresh();
  redirect("/admin/reviews?status=archived&success=restored");
}
