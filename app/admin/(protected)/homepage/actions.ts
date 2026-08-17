"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

const text = (max: number) => z.string().trim().max(max);

export async function saveHomepage(form: FormData) {
  const { user } = await requirePermission("content:write");
  const lines = (key: string) => String(form.get(key) ?? "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean).slice(0, 10);
  const result = z.object({
    heroEyebrow: text(200).transform((value) => value || null),
    heroHeading: text(300).min(1),
    heroDescription: text(1000).min(1),
    heroCtaLabel: text(100).min(1),
    heroCtaUrl: text(500).refine((value) => value.startsWith("/") || /^https?:\/\//.test(value)),
    heroProductId: text(40).transform((value) => value || null),
    promiseHeading: text(200).min(1),
    promiseDescription: text(1000).min(1),
  }).safeParse(Object.fromEntries(form));
  if (!result.success) redirect("/admin/homepage?error=validation");
  const flags = ["showOffer", "showCategories", "showProducts", "showPromise", "showPackToPlate", "showRecipeVideo", "showReviews", "showPreorder", "showGallery", "showNewsletter"];
  const bools = Object.fromEntries(flags.map((key) => [key, form.get(key) === "on"]));
  if (result.data.heroProductId && !await db.product.findUnique({ where: { id: result.data.heroProductId }, select: { id: true } })) redirect("/admin/homepage?error=product");
  const data = { ...result.data, ...bools, promiseItems: lines("promiseItems"), packToPlateItems: lines("packToPlateItems") };
  await db.homepageSettings.upsert({ where: { id: "homepage" }, update: data, create: { id: "homepage", ...data } });
  await writeAuditLog({ adminId: user.id, action: "HOMEPAGE_UPDATED", entityType: "HomepageSettings", entityId: "homepage", summary: `${user.displayName ?? user.username ?? user.email} updated homepage content.` });
  revalidatePath("/");
  redirect("/admin/homepage?success=saved");
}
