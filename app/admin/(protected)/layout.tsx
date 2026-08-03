import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
    <aside className="h-fit rounded-4xl bg-vijaya-dark p-5 text-white shadow-card lg:sticky lg:top-36">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5"><Image src="/assets/images/brand/vijaya-premix-logo.jpeg" alt="Vijaya Premix" width={44} height={44} className="h-11 w-11 rounded-full bg-white object-contain" unoptimized/><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-vijaya-gold">Vijaya Premix</p><p className="font-display font-bold">Admin CMS</p></div></div>
      <nav aria-label="Admin" className="mt-5"><ul className="space-y-1.5 text-sm font-bold"><li><Link href="/admin" className="block rounded-2xl px-4 py-3 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vijaya-gold">Dashboard</Link></li><li><Link href="/admin/products" className="block rounded-2xl bg-vijaya-red px-4 py-3 transition hover:bg-vijaya-red2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vijaya-gold">Products</Link></li><li><Link href="/admin/reviews" className="block rounded-2xl px-4 py-3 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vijaya-gold">Reviews</Link></li>{["Recipes", "Homepage", "Settings"].map((label) => <li key={label}><span aria-disabled="true" className="flex cursor-not-allowed items-center justify-between rounded-2xl px-4 py-3 text-white/40">{label}<span className="text-[9px] uppercase">Later</span></span></li>)}</ul></nav>
      <div className="mt-6 border-t border-white/10 pt-5"><p className="truncate text-xs text-white/60" title={user.email}>{user.email}</p><form action="/admin/auth/logout" method="post" className="mt-3"><button className="w-full rounded-full border border-white/30 px-4 py-2.5 text-sm font-bold transition hover:bg-white hover:text-vijaya-dark">Logout</button></form></div>
    </aside>
    <div className="min-w-0">{children}</div>
  </div>;
}
