import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerStatus } from "@prisma/client";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { updateCustomerStatus } from "../actions";

export const metadata: Metadata = { title: "Customer Detail | Admin" };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("customers:write");
  const { id } = await params;
  const customer = await db.customer.findUnique({ where: { id }, include: { reviews: true, activities: { orderBy: { createdAt: "desc" }, take: 20 }, ugc: { orderBy: { submittedAt: "desc" }, take: 20 } } });
  if (!customer) notFound();
  return <section className="space-y-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Customer Detail</p><h1 className="font-display text-4xl font-bold text-vijaya-red">{customer.name ?? "Unnamed customer"}</h1><p className="text-sm text-vijaya-muted">{customer.email ?? "No email"} · Joined {customer.createdAt.toLocaleDateString("en-IN")}</p></div><form action={updateCustomerStatus} className="rounded-4xl bg-white p-6 shadow-soft"><input type="hidden" name="id" value={customer.id} /><h2 className="font-display text-2xl font-bold text-vijaya-red">Account Status</h2><div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr_auto]"><select name="status" defaultValue={customer.status} className="rounded-2xl border px-4 py-3 text-sm">{Object.values(CustomerStatus).map((status) => <option key={status} value={status}>{status}</option>)}</select><input name="statusReason" defaultValue={customer.statusReason ?? ""} placeholder="Internal reason" className="rounded-2xl border px-4 py-3 text-sm" /><ConfirmSubmit message="Confirm customer status change? Disabled or blocked customers will be signed out." className="rounded-full bg-vijaya-dark px-5 py-2.5 text-sm font-bold text-white">Save Status</ConfirmSubmit></div></form><div className="grid gap-4 lg:grid-cols-3"><article className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-bold">Reviews</h2><p className="font-display text-3xl font-bold text-vijaya-red">{customer.reviews.length}</p></article><article className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-bold">UGC</h2><p className="font-display text-3xl font-bold text-vijaya-red">{customer.ugc.length}</p></article><article className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-bold">Recent Activity</h2><p className="font-display text-3xl font-bold text-vijaya-red">{customer.activities.length}</p></article></div><div className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-display text-2xl font-bold text-vijaya-red">Activity</h2>{customer.activities.length ? <ul className="mt-3 divide-y">{customer.activities.map((activity) => <li key={activity.id} className="py-3 text-sm"><p className="font-bold">{activity.summary}</p><p className="text-xs text-vijaya-muted">{activity.type} · {activity.createdAt.toLocaleString("en-IN")}</p></li>)}</ul> : <p className="mt-3 text-sm text-vijaya-muted">No operational activity recorded.</p>}</div></section>;
}
