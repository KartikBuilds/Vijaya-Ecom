import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type AuditInput = {
  adminId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  changes?: Prisma.InputJsonValue;
};

export async function writeAuditLog(input: AuditInput) {
  await db.auditLog.create({
    data: {
      adminId: input.adminId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary.slice(0, 1000),
      changes: input.changes,
    },
  }).catch(() => undefined);
}
