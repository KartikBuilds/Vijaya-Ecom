"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

const opt = z.string().trim().max(1000).transform((value) => value || null);
const safeUrl = opt.refine((value) => !value || /^https?:\/\//i.test(value), "Use an HTTP(S) URL.");
const safeAsset = z.string().trim().min(1).max(1000).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), "Use a local path or HTTP(S) URL.");
const schema = z.object({
  businessName: z.string().trim().min(1).max(120),
  brandDescription: z.string().trim().min(1).max(1000),
  phone: opt,
  email: z.string().trim().max(254).refine((value) => !value || z.email().safeParse(value).success).transform((value) => value || null),
  address: opt,
  whatsappNumber: z.string().trim().max(30).refine((value) => !value || /^\+?\d{7,15}$/.test(value.replace(/[\s()-]/g, "")), "Enter a valid international WhatsApp number.").transform((value) => value || null),
  whatsappMessage: opt,
  instagramUrl: safeUrl,
  facebookUrl: safeUrl,
  youtubeUrl: safeUrl,
  defaultSiteTitle: z.string().trim().min(1).max(200),
  defaultMetaDescription: z.string().trim().min(1).max(600),
  defaultOgImage: safeAsset,
  aboutHeading: z.string().trim().min(1).max(300),
  aboutDescription: z.string().trim().min(1).max(5000),
  mission: opt,
  vision: opt,
  promiseText: z.string().trim().min(1).max(3000),
});

export async function saveSettings(form: FormData) {
  const { user } = await requirePermission("settings:write");
  const result = schema.safeParse(Object.fromEntries(form));
  if (!result.success) redirect("/admin/settings?error=validation");
  await db.siteSettings.upsert({ where: { id: "site" }, update: result.data, create: { id: "site", ...result.data } });
  await writeAuditLog({ adminId: user.id, action: "SETTINGS_UPDATED", entityType: "SiteSettings", entityId: "site", summary: `${user.displayName ?? user.username ?? user.email} updated website settings.` });
  ["/", "/about", "/products/[slug]", "/recipes/[slug]", "/sitemap.xml"].forEach((path) => revalidatePath(path));
  redirect("/admin/settings?success=saved");
}
