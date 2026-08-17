import type { Metadata } from "next";
import Link from "next/link";
import { CustomerStatus, Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Customers | Admin" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requirePermission("customers:write");
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "all";
  const where: Prisma.CustomerWhereInput = { ...(status !== "all" && Object.values(CustomerStatus).includes(status as CustomerStatus) ? { status: status as CustomerStatus } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }] } : {}) };
  const [customers, counts] = await Promise.all([
    db.customer.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    Promise.all(Object.values(CustomerStatus).map((item) => db.customer.count({ where: { status: item } }))),
  ]);
  return <section className="space-y-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Customer Management</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Customers</h1><p className="text-sm text-vijaya-muted">Search customers, inspect operational history, disable, block, or restore access.</p></div><div className="grid grid-cols-3 gap-3">{Object.values(CustomerStatus).map((item, index) => <article key={item} className="rounded-3xl bg-white p-4 shadow-soft"><p className="font-display text-3xl font-bold text-vijaya-red">{counts[index]}</p><p className="text-xs font-bold text-vijaya-muted">{item}</p></article>)}</div><form className="rounded-4xl bg-white p-5 shadow-soft"><div className="flex flex-col gap-3 sm:flex-row"><input name="q" defaultValue={q} placeholder="Search name, email, or phone" className="min-w-0 flex-1 rounded-full border px-5 py-3 text-sm" /><select name="status" defaultValue={status} className="rounded-full border px-5 py-3 text-sm"><option value="all">All statuses</option>{Object.values(CustomerStatus).map((item) => <option key={item} value={item}>{item}</option>)}</select><button className="rounded-full border-2 border-vijaya-red px-5 py-2 font-bold text-vijaya-red">Apply</button></div></form><div className="rounded-4xl bg-white p-4 shadow-soft">{customers.length ? <div className="divide-y divide-vijaya-red/10">{customers.map((customer) => <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="block py-4 hover:text-vijaya-red"><p className="font-bold">{customer.name ?? "Unnamed customer"}</p><p className="text-sm text-vijaya-muted">{customer.email ?? "No email"} · {customer.phone ?? "No phone"} · {customer.status}</p></Link>)}</div> : <p className="p-8 text-center text-sm text-vijaya-muted">No customers match these filters.</p>}</div></section>;
}
