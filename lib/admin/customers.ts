import "server-only";
import { CustomerStatus } from "@prisma/client";
import { writeAuditLog } from "@/lib/admin/audit";
import { db } from "@/lib/db";

export async function setCustomerStatus(input: { adminId: string; customerId: string; status: CustomerStatus; statusReason?: string | null }) {
  const customer = await db.$transaction(async (tx) => {
    const updated = await tx.customer.update({
      where: { id: input.customerId },
      data: { status: input.status, statusReason: input.statusReason?.trim() || null },
    });
    if (input.status !== CustomerStatus.ACTIVE) await tx.customerSession.deleteMany({ where: { customerId: input.customerId } });
    return updated;
  });
  await writeAuditLog({ adminId: input.adminId, action: "CUSTOMER_STATUS_UPDATED", entityType: "Customer", entityId: input.customerId, summary: `Customer status updated to ${input.status}.`, changes: { status: input.status } });
  return customer;
}
