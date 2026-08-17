"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export async function markNotificationRead(form: FormData) {
  const { user } = await requirePermission("notifications:write");
  const id = String(form.get("id") ?? "");
  if (id) await db.notification.updateMany({ where: { id, OR: [{ userId: user.id }, { userId: null }] }, data: { readAt: new Date() } });
  redirect("/admin/notifications");
}

export async function markAllNotificationsRead() {
  const { user } = await requirePermission("notifications:write");
  await db.notification.updateMany({ where: { OR: [{ userId: user.id }, { userId: null }], readAt: null }, data: { readAt: new Date() } });
  redirect("/admin/notifications");
}
