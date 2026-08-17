"use server";

import { FeedbackStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/admin/audit";
import { db } from "@/lib/db";

export async function updateFeedback(form: FormData) {
  const { user } = await requirePermission("feedback:write");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as FeedbackStatus;
  const internalNotes = String(form.get("internalNotes") ?? "").trim() || null;
  if (!id || !Object.values(FeedbackStatus).includes(status)) redirect("/admin/feedback?error=validation");
  await db.feedback.update({ where: { id }, data: { status, internalNotes } });
  await writeAuditLog({ adminId: user.id, action: "FEEDBACK_UPDATED", entityType: "Feedback", entityId: id, summary: `${user.displayName ?? user.username ?? user.email} updated feedback status.` });
  redirect("/admin/feedback?success=updated");
}
