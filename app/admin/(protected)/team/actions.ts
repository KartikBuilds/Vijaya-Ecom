"use server";

import { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

const staffSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  username: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_.-]+$/),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  role: z.nativeEnum(Role).refine((role) => role !== Role.SUPER_ADMIN, "Create Super Admins intentionally through role edit."),
});

export async function createStaffAdmin(form: FormData) {
  const { user } = await requirePermission("team:write");
  const result = staffSchema.safeParse(Object.fromEntries(form));
  if (!result.success) redirect("/admin/team?error=validation");
  try {
    const staff = await db.user.create({ data: { displayName: result.data.displayName, username: result.data.username, email: result.data.email, role: result.data.role, passwordHash: await hash(result.data.password, 12), active: true } });
    await writeAuditLog({ adminId: user.id, action: "ADMIN_CREATED", entityType: "User", entityId: staff.id, summary: `${user.displayName ?? user.username ?? user.email} created admin ${staff.email}.` });
  } catch {
    redirect("/admin/team?error=duplicate");
  }
  redirect("/admin/team?success=created");
}

export async function updateStaffAdmin(form: FormData) {
  const { user } = await requirePermission("team:write");
  const id = String(form.get("id") ?? "");
  const active = form.get("active") === "on";
  const role = String(form.get("role") ?? "") as Role;
  if (!id || !Object.values(Role).includes(role)) redirect("/admin/team?error=validation");
  if (!active) {
    const target = await db.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === Role.SUPER_ADMIN) {
      const activeSuperAdmins = await db.user.count({ where: { role: Role.SUPER_ADMIN, active: true, id: { not: id } } });
      if (activeSuperAdmins < 1) redirect("/admin/team?error=last-super");
    }
  }
  await db.user.update({ where: { id }, data: { role, active } });
  if (!active) await db.adminSession.deleteMany({ where: { userId: id } });
  await writeAuditLog({ adminId: user.id, action: "ADMIN_ACCESS_UPDATED", entityType: "User", entityId: id, summary: `${user.displayName ?? user.username ?? user.email} updated admin access.` });
  redirect("/admin/team?success=updated");
}
