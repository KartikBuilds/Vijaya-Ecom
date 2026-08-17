import type { Metadata } from "next";
import { requirePermission, permissionsByRole, roleLabels } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Roles & Permissions | Admin" };

export default async function RolesPage() {
  await requirePermission("roles:read");
  return <section className="space-y-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Authorization</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Roles & Permissions</h1><p className="text-sm text-vijaya-muted">Server-side RBAC is enforced through centralized helpers for pages and mutations.</p></div><div className="grid gap-4 lg:grid-cols-2">{Object.entries(permissionsByRole).map(([role, permissions]) => <article key={role} className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-display text-2xl font-bold text-vijaya-red">{roleLabels[role as keyof typeof roleLabels]}</h2><ul className="mt-4 flex flex-wrap gap-2">{permissions.map((permission) => <li key={permission} className="rounded-full bg-vijaya-offwhite px-3 py-1.5 text-xs font-bold">{permission}</li>)}</ul></article>)}</div></section>;
}
