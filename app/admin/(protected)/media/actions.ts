"use server";

import { MediaType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { isSafeUpload } from "@/lib/media/upload-validation";

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
      if (asset.provider === "vercel-blob") {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          await del(asset.url).catch(() => undefined);
        }
      }
      await db.mediaAsset.delete({ where: { id } }).catch(() => undefined);
    }
  }
  redirect("/admin/media?success=deleted");
}

import { put, del } from "@vercel/blob";

export async function uploadDevelopmentMedia(form: FormData) {
  await requirePermission("media:write");
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024) redirect("/admin/media?error=upload");
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = isSafeUpload(buffer, file.type);
  if (!detected) redirect("/admin/media?error=upload");
  const finalName = `${randomUUID()}${detected.extension}`;

  if (process.env.NODE_ENV === "production" || process.env.BLOB_READ_WRITE_TOKEN) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/admin/media?error=provider");
    const blob = await put(`uploads/${finalName}`, file, {
      access: "public",
      contentType: file.type,
    });
    await db.mediaAsset.create({ data: { filename: file.name.slice(0, 255), url: blob.url, type: detected.type, sizeBytes: file.size, provider: "vercel-blob", usageNotes: "Production Vercel Blob storage." } });
  } else {
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, finalName), buffer, { flag: "wx" });
    const url = `/uploads/${finalName}`;
    await db.mediaAsset.create({ data: { filename: file.name.slice(0, 255), url, type: detected.type, sizeBytes: file.size, provider: "local-development", usageNotes: "Local development upload." } });
  }

  redirect("/admin/media?success=uploaded");
}
