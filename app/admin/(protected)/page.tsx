import type { Metadata } from "next";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin Dashboard" };
const areas = [
  ["Products", "Product management arrives in Step 3."],
  ["Reviews", "Review management will be added later."],
  ["Recipes", "Recipe management will be added later."],
  ["Website Settings", "Site customization will be added later."],
];

export default async function AdminDashboard() {
  const { user } = await requireAdmin();
  return <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-5 rounded-4xl bg-vijaya-dark p-6 text-white shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex items-center gap-4"><Image src="/assets/images/brand/vijaya-premix-logo.jpeg" alt="Vijaya Premix" width={56} height={56} className="h-14 w-14 rounded-full bg-white object-contain" unoptimized /><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Vijaya Premix Admin</p><h1 className="font-display text-3xl font-bold">Dashboard</h1></div></div>
      <form action="/admin/auth/logout" method="post"><button className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-bold transition hover:bg-white hover:text-vijaya-dark">Logout</button></form>
    </div>
    <div className="mt-8"><h2 className="font-display text-3xl font-bold text-vijaya-red">Welcome</h2><p className="mt-1 text-vijaya-muted">Signed in as {user.email}</p></div>
    <section className="mt-8 rounded-4xl bg-white p-6 shadow-soft sm:p-8"><h2 className="font-display text-2xl font-bold">Current Catalogue</h2><div className="mt-5 grid grid-cols-3 gap-3 text-center sm:max-w-lg">{[["7", "Products"], ["2", "Veg"], ["5", "Non-Veg"]].map(([count, label]) => <div key={label} className="rounded-3xl bg-vijaya-pink p-4"><p className="font-display text-3xl font-extrabold text-vijaya-red">{count}</p><p className="text-xs font-bold text-vijaya-muted sm:text-sm">{label}</p></div>)}</div></section>
    <div className="mt-6 grid gap-5 sm:grid-cols-2">{areas.map(([title, description]) => <article key={title} className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-display text-xl font-bold text-vijaya-red">{title}</h2><p className="mt-2 text-sm text-vijaya-muted">{description}</p></article>)}</div>
  </section>;
}
