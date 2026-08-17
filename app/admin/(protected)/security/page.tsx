import type { Metadata } from "next";
import { getCurrentAdminSessionRecord, requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { changePassword, logoutAllSessions, logoutOtherSessions } from "./actions";

export const metadata: Metadata = { title: "Security | Admin" };
const input = "w-full rounded-2xl border border-vijaya-red/20 bg-white px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vijaya-red";

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { user } = await requireAdmin();
  const params = await searchParams;
  const [sessions, current] = await Promise.all([
    db.adminSession.findMany({ where: { userId: user.id }, orderBy: { lastUsedAt: "desc" } }),
    getCurrentAdminSessionRecord(),
  ]);
  return <section className="space-y-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Account Protection</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Security</h1><p className="text-sm text-vijaya-muted">Change password, review active sessions, and manage device access.</p></div>
    {params.success && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">Security changes saved.</p>}
    {params.error && <p className="rounded-2xl bg-vijaya-pink px-4 py-3 text-sm font-bold text-vijaya-red">{params.error === "current" ? "Current password is incorrect." : "New password must match and be 12-128 characters."}</p>}
    <form action={changePassword} className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-display text-2xl font-bold text-vijaya-red">Change Password</h2><div className="mt-4 grid gap-4 sm:grid-cols-3"><div><label htmlFor="currentPassword" className="mb-1 block text-sm font-bold">Current Password</label><input id="currentPassword" name="currentPassword" type="password" required className={input} /></div><div><label htmlFor="newPassword" className="mb-1 block text-sm font-bold">New Password</label><input id="newPassword" name="newPassword" type="password" minLength={12} maxLength={128} required className={input} /></div><div><label htmlFor="confirmPassword" className="mb-1 block text-sm font-bold">Confirm Password</label><input id="confirmPassword" name="confirmPassword" type="password" minLength={12} maxLength={128} required className={input} /></div></div><button className="mt-5 rounded-full bg-vijaya-red px-7 py-3 font-bold text-white">Save Changes</button></form>
    <div className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-display text-2xl font-bold text-vijaya-red">Active Sessions</h2><p className="mt-1 text-sm text-vijaya-muted">Last login: {user.lastLoginAt?.toLocaleString("en-IN") ?? "Not recorded"}</p><div className="mt-4 divide-y divide-vijaya-red/10">{sessions.map((session) => <article key={session.id} className="py-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold">{session.id === current?.id ? "Current session" : "Admin session"}</p><p className="text-vijaya-muted">{session.userAgent ?? "Device information unavailable"}</p><p className="text-xs text-vijaya-muted">Last used {session.lastUsedAt.toLocaleString("en-IN")} · Expires {session.expiresAt.toLocaleString("en-IN")}</p></div>{session.id === current?.id && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Current</span>}</div></article>)}</div><div className="mt-5 flex flex-wrap gap-3"><form action={logoutOtherSessions}><button className="rounded-full border-2 border-vijaya-red px-5 py-2.5 font-bold text-vijaya-red">Logout All Other Sessions</button></form><form action={logoutAllSessions}><button className="rounded-full bg-vijaya-dark px-5 py-3 font-bold text-white">Logout All Sessions</button></form></div></div>
    <div className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-display text-2xl font-bold text-vijaya-red">Two-Factor Authentication</h2><p className="mt-2 text-sm font-bold text-vijaya-muted">2FA configuration pending</p><p className="mt-1 text-sm text-vijaya-muted">The database has future-ready 2FA status fields, but TOTP secrets and recovery-code lifecycle are intentionally not faked.</p></div>
  </section>;
}
