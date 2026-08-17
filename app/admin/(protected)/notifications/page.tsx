import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export const metadata: Metadata = { title: "Notifications | Admin" };

export default async function NotificationsPage() {
  const { user } = await requirePermission("notifications:write");
  const notifications = await db.notification.findMany({ where: { OR: [{ userId: user.id }, { userId: null }] }, orderBy: { createdAt: "desc" }, take: 100 });
  return <section className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Notification Center</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Notifications</h1><p className="text-sm text-vijaya-muted">Unread/read system events linked to relevant admin entities.</p></div><form action={markAllNotificationsRead}><button className="rounded-full border-2 border-vijaya-red px-5 py-2.5 font-bold text-vijaya-red">Mark All Read</button></form></div><div className="rounded-4xl bg-white p-4 shadow-soft">{notifications.length ? <div className="divide-y divide-vijaya-red/10">{notifications.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold text-vijaya-dark">{item.title} {!item.readAt && <span className="ml-2 rounded-full bg-vijaya-red px-2 py-0.5 text-[10px] text-white">Unread</span>}</p><p className="text-sm text-vijaya-muted">{item.message ?? item.type}</p><p className="text-xs text-vijaya-muted">{item.createdAt.toLocaleString("en-IN")}</p></div><div className="flex gap-2">{item.href && <Link href={item.href} className="rounded-full border px-4 py-2 text-xs font-bold">Open</Link>}{!item.readAt && <form action={markNotificationRead}><input type="hidden" name="id" value={item.id} /><button className="rounded-full bg-vijaya-dark px-4 py-2 text-xs font-bold text-white">Mark Read</button></form>}</div></article>)}</div> : <p className="p-8 text-center text-sm text-vijaya-muted">No notifications yet. Future order/payment events remain dormant until those systems exist.</p>}</div></section>;
}
