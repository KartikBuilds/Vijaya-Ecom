"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

const schema = z.object({
  displayName: z.string().trim().min(1).max(120),
  username: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_.-]+$/),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(40).transform((value) => value || null),
  profilePhoto: z.string().trim().max(1000).refine((value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value), "Use a local path or HTTP(S) URL.").transform((value) => value || null),
  bio: z.string().trim().max(500).transform((value) => value || null),
});

export async function updateProfile(form: FormData) {
  const { user } = await requirePermission("profile:write");
  const result = schema.safeParse(Object.fromEntries(form));
  if (!result.success) redirect("/admin/profile?error=validation");
  try {
    await db.user.update({ where: { id: user.id }, data: result.data });
    await writeAuditLog({ adminId: user.id, action: "ADMIN_PROFILE_UPDATED", entityType: "User", entityId: user.id, summary: `${result.data.displayName} updated their admin profile.` });
  } catch {
    redirect("/admin/profile?error=duplicate");
  }
  revalidatePath("/admin/profile");
  redirect("/admin/profile?success=saved");
}
