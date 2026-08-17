"use server";

import { UgcStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/admin/audit";
import { db } from "@/lib/db";

export async function updateUgc(form: FormData) {
  const { user } = await requirePermission("content:write");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as UgcStatus;
  if (!id || !Object.values(UgcStatus).includes(status)) redirect("/admin/ugc?error=validation");
  await db.userGeneratedContent.update({ where: { id }, data: { status, featured: form.get("featured") === "on", pinned: form.get("pinned") === "on", moderationNotes: String(form.get("moderationNotes") ?? "").trim() || null } });
  await writeAuditLog({ adminId: user.id, action: "UGC_MODERATED", entityType: "UserGeneratedContent", entityId: id, summary: `${user.displayName ?? user.username ?? user.email} moderated user content.` });
  redirect("/admin/ugc?success=updated");
}
