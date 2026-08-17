"use server";

import { CustomerStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";
import { setCustomerStatus } from "@/lib/admin/customers";

export async function updateCustomerStatus(form: FormData) {
  const { user } = await requirePermission("customers:write");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as CustomerStatus;
  const statusReason = String(form.get("statusReason") ?? "").trim() || null;
  if (!id || !Object.values(CustomerStatus).includes(status)) redirect("/admin/customers?error=validation");
  await setCustomerStatus({ adminId: user.id, customerId: id, status, statusReason });
  redirect(`/admin/customers/${id}?success=status`);
}
