"use server";

import { BannerPlacement, ContentStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

const optional = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const schema = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: optional(400),
  imagePath: optional(1000),
  ctaLabel: optional(80),
  ctaUrl: optional(500).refine((value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value)),
  placement: z.nativeEnum(BannerPlacement),
  status: z.nativeEnum(ContentStatus),
  publishAt: z.string().transform((value) => value ? new Date(value) : null),
  unpublishAt: z.string().transform((value) => value ? new Date(value) : null),
  featured: z.boolean(),
  pinned: z.boolean(),
  sortOrder: z.coerce.number().int().min(-9999).max(9999),
});

export async function createBanner(form: FormData) {
  const { user } = await requirePermission("content:write");
  const result = schema.safeParse({ ...Object.fromEntries(form), featured: form.get("featured") === "on", pinned: form.get("pinned") === "on" });
  if (!result.success) redirect("/admin/banners?error=validation");
  const banner = await db.banner.create({ data: result.data });
  await writeAuditLog({ adminId: user.id, action: "BANNER_CREATED", entityType: "Banner", entityId: banner.id, summary: `${user.displayName ?? user.username ?? user.email} created banner ${banner.title}.` });
  redirect("/admin/banners?success=created");
}

export async function archiveBanner(form: FormData) {
  const { user } = await requirePermission("content:write");
  const id = String(form.get("id") ?? "");
  if (id) await db.banner.update({ where: { id }, data: { status: ContentStatus.ARCHIVED } });
  await writeAuditLog({ adminId: user.id, action: "BANNER_ARCHIVED", entityType: "Banner", entityId: id, summary: `${user.displayName ?? user.username ?? user.email} archived a banner.` });
  redirect("/admin/banners?success=archived");
}
