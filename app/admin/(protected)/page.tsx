import type { Metadata } from "next";
import Link from "next/link";
import { ProductStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Admin Dashboard" };
const future = [["Reviews", "Review management will be added later."], ["Recipes", "Recipe management will be added later."], ["Homepage", "Homepage controls will be added later."], ["Settings", "Site settings will be added later."]];

export default async function AdminDashboard() {
  const [total, published, drafts, archived, veg, nonVeg] = await Promise.all([
    db.product.count(), db.product.count({ where: { status: ProductStatus.PUBLISHED } }), db.product.count({ where: { status: ProductStatus.DRAFT } }), db.product.count({ where: { status: ProductStatus.ARCHIVED } }),
    db.product.count({ where: { category: { slug: "veg" } } }), db.product.count({ where: { category: { slug: "non-veg" } } }),
  ]);
  const stats = [[total, "Products"], [published, "Published"], [drafts, "Drafts"], [archived, "Archived"], [veg, "Veg"], [nonVeg, "Non-Veg"]];
  return <section><div className="rounded-4xl bg-white p-6 shadow-soft sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Vijaya Premix Admin</p><div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="font-display text-4xl font-bold text-vijaya-red">Dashboard</h1><p className="mt-1 text-sm text-vijaya-muted">Database-backed product administration.</p></div><Link href="/admin/products" className="rounded-full bg-vijaya-red px-6 py-3 text-center font-bold text-white">Manage Products</Link></div></div>
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{stats.map(([count,label]) => <article key={label} className="rounded-3xl bg-white p-5 text-center shadow-soft"><p className="font-display text-3xl font-extrabold text-vijaya-red">{count}</p><h2 className="text-xs font-bold text-vijaya-muted sm:text-sm">{label}</h2></article>)}</div>
    <div className="mt-6 rounded-3xl border border-vijaya-gold/30 bg-vijaya-offwhite p-5 text-sm text-vijaya-muted"><strong className="text-vijaya-dark">Storefront synchronization is implemented in Step 4.</strong> Product changes made here do not yet update the customer storefront.</div>
    <div className="mt-6 grid gap-5 sm:grid-cols-2">{future.map(([title,description]) => <article key={title} className="rounded-4xl bg-white p-6 opacity-70 shadow-soft"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold text-vijaya-dark">{title}</h2><span className="rounded-full bg-vijaya-pink px-2.5 py-1 text-[10px] font-bold uppercase text-vijaya-muted">Future</span></div><p className="mt-2 text-sm text-vijaya-muted">{description}</p></article>)}</div>
  </section>;
}
