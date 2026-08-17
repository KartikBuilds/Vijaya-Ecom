"use server";

import { Prisma, Role } from "@prisma/client";
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
  try {
    await db.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id }, select: { role: true, active: true } });
      if (!target) throw new Error("missing");
      const wouldRemoveActiveSuper = target.role === Role.SUPER_ADMIN && target.active && (!active || role !== Role.SUPER_ADMIN);
      if (wouldRemoveActiveSuper) {
        const activeSuperAdmins = await tx.user.count({ where: { role: Role.SUPER_ADMIN, active: true, id: { not: id } } });
        if (activeSuperAdmins < 1) throw new Error("last-super");
      }
      await tx.user.update({ where: { id }, data: { role, active } });
      if (!active || role !== target.role) await tx.adminSession.deleteMany({ where: { userId: id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Error && error.message === "last-super") redirect("/admin/team?error=last-super");
    if (error instanceof Error && error.message === "missing") redirect("/admin/team?error=validation");
    throw error;
  }
  await writeAuditLog({ adminId: user.id, action: "ADMIN_ACCESS_UPDATED", entityType: "User", entityId: id, summary: `${user.displayName ?? user.username ?? user.email} updated admin access.` });
  redirect("/admin/team?success=updated");
}
