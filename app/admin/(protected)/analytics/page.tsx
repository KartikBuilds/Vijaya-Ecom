import type { Metadata } from "next";
import { AnalyticsEventType } from "@prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Analytics | Admin" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requirePermission("analytics:read");
  const range = (await searchParams).range ?? "7";
  const days = range === "30" ? 30 : range === "1" ? 1 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const counts = await Promise.all(Object.values(AnalyticsEventType).map((type) => db.analyticsEvent.count({ where: { type, createdAt: { gte: since } } })));
  const topSearches = await db.analyticsEvent.groupBy({ by: ["searchQuery"], where: { type: AnalyticsEventType.SEARCH, createdAt: { gte: since }, searchQuery: { not: null } }, _count: true, orderBy: { _count: { searchQuery: "desc" } }, take: 10 });
  return <section className="space-y-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Insights</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Analytics</h1><p className="text-sm text-vijaya-muted">Privacy-conscious first-party events. No fake sales or traffic values are shown.</p></div><div className="flex flex-wrap gap-2">{[["1", "Today"], ["7", "7 Days"], ["30", "30 Days"]].map(([value, label]) => <a key={value} href={`/admin/analytics?range=${value}`} className={`rounded-full px-4 py-2 text-sm font-bold ${range === value ? "bg-vijaya-red text-white" : "bg-white"}`}>{label}</a>)}</div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.values(AnalyticsEventType).map((type, index) => <article key={type} className="rounded-3xl bg-white p-5 shadow-soft"><p className="font-display text-3xl font-bold text-vijaya-red">{counts[index]}</p><p className="text-xs font-bold text-vijaya-muted">{type}</p></article>)}</div><div className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-display text-2xl font-bold text-vijaya-red">Popular Searches</h2>{topSearches.length ? <ul className="mt-3 divide-y">{topSearches.map((item) => <li key={item.searchQuery} className="flex justify-between py-3 text-sm"><span>{item.searchQuery}</span><strong>{item._count}</strong></li>)}</ul> : <p className="mt-3 text-sm text-vijaya-muted">No search analytics recorded.</p>}</div></section>;
}
