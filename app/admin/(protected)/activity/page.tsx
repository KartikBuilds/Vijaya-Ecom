import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Activity History | Admin" };

export default async function ActivityPage() {
  await requirePermission("activity:read");
  const logs = await db.auditLog.findMany({ include: { admin: { select: { displayName: true, username: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return <section className="space-y-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Audit Log</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Activity History</h1><p className="text-sm text-vijaya-muted">Important admin actions with safe summaries. Secrets and session tokens are never logged.</p></div><div className="rounded-4xl bg-white p-4 shadow-soft">{logs.length ? <div className="divide-y divide-vijaya-red/10">{logs.map((log) => <article key={log.id} className="py-4"><p className="font-bold">{log.summary}</p><p className="text-xs text-vijaya-muted">{log.action} · {log.entityType}{log.entityId ? `:${log.entityId}` : ""} · {log.admin?.displayName ?? log.admin?.username ?? log.admin?.email ?? "System"} · {log.createdAt.toLocaleString("en-IN")}</p></article>)}</div> : <p className="p-8 text-center text-sm text-vijaya-muted">No audit activity has been recorded yet.</p>}</div></section>;
}
