import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { can, roleLabels, type Permission } from "@/lib/auth/permissions";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const nav: { label: string; href: string; permission?: Permission }[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Profile", href: "/admin/profile" },
  { label: "Products", href: "/admin/products", permission: "products:write" },
  { label: "Recipes", href: "/admin/recipes", permission: "recipes:write" },
  { label: "Reviews", href: "/admin/reviews", permission: "reviews:moderate" },
  { label: "Media Library", href: "/admin/media", permission: "media:write" },
  { label: "Customers", href: "/admin/customers", permission: "customers:write" },
  { label: "User Content", href: "/admin/ugc", permission: "content:write" },
  { label: "Feedback", href: "/admin/feedback", permission: "feedback:write" },
  { label: "Notifications", href: "/admin/notifications", permission: "notifications:write" },
  { label: "Analytics", href: "/admin/analytics", permission: "analytics:read" },
  { label: "Homepage", href: "/admin/homepage", permission: "content:write" },
  { label: "Banners", href: "/admin/banners", permission: "content:write" },
  { label: "Team", href: "/admin/team", permission: "team:write" },
  { label: "Roles & Permissions", href: "/admin/roles", permission: "roles:read" },
  { label: "Activity History", href: "/admin/activity", permission: "activity:read" },
  { label: "Security", href: "/admin/security" },
  { label: "Website Settings", href: "/admin/settings", permission: "settings:write" },
];

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  const unread = await db.notification.count({ where: { OR: [{ userId: user.id }, { userId: null }], readAt: null } }).catch(() => 0);
  const visibleNav = nav.filter((item) => !item.permission || can(user, item.permission));
  return <div className="mx-auto grid max-w-[1500px] gap-5 px-3 py-6 sm:px-5 lg:grid-cols-[260px_1fr] lg:px-8">
    <aside className="h-fit rounded-3xl bg-vijaya-dark p-4 text-white shadow-card lg:sticky lg:top-28">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Image src="/assets/images/brand/vijaya-premix-logo.jpeg" alt="Vijaya Premix" width={44} height={44} className="h-11 w-11 rounded-full bg-white object-contain" unoptimized />
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-vijaya-gold">Vijaya Admin</p><p className="font-display font-bold">Management</p></div>
      </div>
      <nav aria-label="Admin" className="mt-4 max-h-[60vh] overflow-y-auto pr-1"><ul className="space-y-1 text-sm font-bold">{visibleNav.map((item) => <li key={item.href}><Link href={item.href} className="block rounded-2xl px-4 py-2.5 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vijaya-gold">{item.label}</Link></li>)}</ul></nav>
      <div className="mt-5 border-t border-white/10 pt-4">
        <Link href="/admin/notifications" className="mb-3 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-bold"><span>Notifications</span><span className="rounded-full bg-vijaya-red px-2 py-0.5 text-xs">{unread}</span></Link>
        <p className="truncate text-xs text-white/70" title={user.email}>{user.displayName ?? user.username ?? user.email}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-vijaya-gold">{roleLabels[user.role]}</p>
        <form action="/admin/auth/logout" method="post" className="mt-3"><button className="w-full rounded-full border border-white/30 px-4 py-2.5 text-sm font-bold transition hover:bg-white hover:text-vijaya-dark">Logout</button></form>
      </div>
    </aside>
    <main className="min-w-0">{children}</main>
  </div>;
}
