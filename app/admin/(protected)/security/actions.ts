"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/permissions";
import { destroyAllAdminSessions, destroyOtherAdminSessions } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function changePassword(form: FormData) {
  const { user } = await requirePermission("security:write");
  const currentPassword = String(form.get("currentPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  if (newPassword.length < 12 || newPassword.length > 128 || newPassword !== confirmPassword) redirect("/admin/security?error=password");
  const fresh = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!fresh || !await compare(currentPassword, fresh.passwordHash)) redirect("/admin/security?error=current");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hash(newPassword, 12) } });
  await destroyOtherAdminSessions(user.id);
  await writeAuditLog({ adminId: user.id, action: "ADMIN_PASSWORD_CHANGED", entityType: "User", entityId: user.id, summary: `${user.displayName ?? user.username ?? user.email} changed their password.` });
  redirect("/admin/security?success=password");
}

export async function logoutOtherSessions() {
  const { user } = await requirePermission("security:write");
  await destroyOtherAdminSessions(user.id);
  await writeAuditLog({ adminId: user.id, action: "ADMIN_SESSIONS_REVOKED", entityType: "User", entityId: user.id, summary: `${user.displayName ?? user.username ?? user.email} logged out other sessions.` });
  redirect("/admin/security?success=sessions");
}

export async function logoutAllSessions() {
  const { user } = await requirePermission("security:write");
  await writeAuditLog({ adminId: user.id, action: "ADMIN_ALL_SESSIONS_REVOKED", entityType: "User", entityId: user.id, summary: `${user.displayName ?? user.username ?? user.email} logged out all sessions.` });
  await destroyAllAdminSessions(user.id);
  redirect("/admin/login");
}
