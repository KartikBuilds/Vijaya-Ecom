"use server";

import { CustomerStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/admin/audit";
import { db } from "@/lib/db";

export async function updateCustomerStatus(form: FormData) {
  const { user } = await requirePermission("customers:write");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as CustomerStatus;
  const statusReason = String(form.get("statusReason") ?? "").trim() || null;
  if (!id || !Object.values(CustomerStatus).includes(status)) redirect("/admin/customers?error=validation");
  await db.customer.update({ where: { id }, data: { status, statusReason } });
  if (status !== CustomerStatus.ACTIVE) await db.customerSession.deleteMany({ where: { customerId: id } });
  await writeAuditLog({ adminId: user.id, action: "CUSTOMER_STATUS_UPDATED", entityType: "Customer", entityId: id, summary: `${user.displayName ?? user.username ?? user.email} updated customer status to ${status}.` });
  redirect(`/admin/customers/${id}?success=status`);
}
