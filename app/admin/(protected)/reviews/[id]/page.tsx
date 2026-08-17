import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewForm, type ReviewFormValue } from "@/components/admin/ReviewForm";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { updateReview } from "../actions";

export const metadata: Metadata = { title: "Edit Review | Admin" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("reviews:moderate");
  const { id } = await params;
  const [review, products] = await Promise.all([db.review.findUnique({ where: { id } }), db.product.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })]);
  if (!review) notFound();
  const value: ReviewFormValue = { customerName: review.customerName, rating: review.rating, content: review.content, productId: review.productId ?? "", status: review.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT", featured: review.featured, sortOrder: review.sortOrder, reviewDate: review.reviewDate?.toISOString().slice(0, 10) ?? "" };
  return <section className="max-w-4xl"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-vijaya-gold">Reviews CMS</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Edit Review</h1><p className="mb-7 mt-1 text-sm text-vijaya-muted">Archived reviews must be deliberately saved as Draft or Published.</p><ReviewForm action={updateReview.bind(null, id)} products={products} value={value} /></section>;
}
