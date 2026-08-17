"use server";

import { MediaType } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

const schema = z.object({
  filename: z.string().trim().min(1).max(255),
  url: z.string().trim().min(1).max(1000).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value)),
  type: z.nativeEnum(MediaType),
  altText: z.string().trim().max(300).transform((value) => value || null),
  usageNotes: z.string().trim().max(1000).transform((value) => value || null),
});

export async function createMediaAsset(form: FormData) {
  await requirePermission("media:write");
  const result = schema.safeParse(Object.fromEntries(form));
  if (!result.success) redirect("/admin/media?error=validation");
  await db.mediaAsset.create({ data: result.data });
  redirect("/admin/media?success=created");
}

export async function deleteUnusedMediaAsset(form: FormData) {
  await requirePermission("media:write");
  const id = String(form.get("id") ?? "");
  if (id) {
    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (asset) {
      const [products, recipes, banners, ugc] = await Promise.all([
        db.product.count({ where: { imagePath: asset.url } }),
        db.recipe.count({ where: { imagePath: asset.url } }),
        db.banner.count({ where: { imagePath: asset.url } }),
        db.userGeneratedContent.count({ where: { imagePath: asset.url } }),
      ]);
      if (products + recipes + banners + ugc > 0) redirect("/admin/media?error=in-use");
      await db.mediaAsset.delete({ where: { id } }).catch(() => undefined);
    }
  }
  redirect("/admin/media?success=deleted");
}

export async function uploadDevelopmentMedia(form: FormData) {
  await requirePermission("media:write");
  if (process.env.NODE_ENV === "production" && !process.env.MEDIA_UPLOAD_PROVIDER) redirect("/admin/media?error=provider");
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024) redirect("/admin/media?error=upload");
  const allowed = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/gif", ".gif"], ["image/svg+xml", ".svg"], ["video/mp4", ".mp4"]]);
  const extension = allowed.get(file.type);
  if (!extension) redirect("/admin/media?error=upload");
  const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/\.+/g, ".").slice(0, 80) || `media${extension}`;
  const finalName = `${Date.now()}-${safeBase.endsWith(extension) || extname(safeBase) ? safeBase : `${safeBase}${extension}`}`;
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, finalName), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
  const url = `/uploads/${finalName}`;
  await db.mediaAsset.create({ data: { filename: file.name, url, type: file.type.startsWith("video/") ? MediaType.VIDEO : MediaType.IMAGE, sizeBytes: file.size, provider: "local-development", usageNotes: "Local development upload. Configure durable storage for production." } });
  redirect("/admin/media?success=uploaded");
}
