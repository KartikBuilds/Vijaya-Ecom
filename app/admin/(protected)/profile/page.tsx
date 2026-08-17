import type { Metadata } from "next";
import { roleLabels } from "@/lib/auth/permissions";
import { requireAdmin } from "@/lib/auth/session";
import { updateProfile } from "./actions";

export const metadata: Metadata = { title: "Profile | Admin" };
const input = "w-full rounded-2xl border border-vijaya-red/20 bg-white px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vijaya-red";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { user } = await requireAdmin();
  const params = await searchParams;
  return <section className="space-y-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Account Settings</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Admin Profile</h1><p className="text-sm text-vijaya-muted">Edit Profile, Save Changes, or Cancel without changing privileged role data.</p></div>
    {params.success && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">Profile saved.</p>}
    {params.error && <p className="rounded-2xl bg-vijaya-pink px-4 py-3 text-sm font-bold text-vijaya-red">{params.error === "duplicate" ? "Username or email is already in use." : "Review the profile fields."}</p>}
    <form action={updateProfile} className="rounded-4xl bg-white p-6 shadow-soft">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-bold" htmlFor="displayName">Display Name</label><input id="displayName" name="displayName" required defaultValue={user.displayName ?? user.username ?? user.email} className={input} /></div>
        <div><label className="mb-1 block text-sm font-bold" htmlFor="username">Username</label><input id="username" name="username" required defaultValue={user.username ?? ""} className={input} /></div>
        <div><label className="mb-1 block text-sm font-bold" htmlFor="email">Email</label><input id="email" name="email" type="email" required defaultValue={user.email} className={input} /></div>
        <div><label className="mb-1 block text-sm font-bold" htmlFor="phone">Phone</label><input id="phone" name="phone" defaultValue={user.phone ?? ""} className={input} /></div>
        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-bold" htmlFor="profilePhoto">Profile Photo URL</label><input id="profilePhoto" name="profilePhoto" defaultValue={user.profilePhoto ?? ""} placeholder="/assets/..." className={input} /></div>
        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-bold" htmlFor="bio">Internal Bio</label><textarea id="bio" name="bio" rows={4} defaultValue={user.bio ?? ""} className={input} /></div>
      </div>
      <dl className="mt-6 grid gap-3 rounded-3xl bg-vijaya-offwhite p-4 text-sm sm:grid-cols-3"><div><dt className="font-bold">Role</dt><dd>{roleLabels[user.role]}</dd></div><div><dt className="font-bold">Created</dt><dd>{user.createdAt.toLocaleString("en-IN")}</dd></div><div><dt className="font-bold">Last Login</dt><dd>{user.lastLoginAt?.toLocaleString("en-IN") ?? "Not recorded"}</dd></div></dl>
      <div className="mt-6 flex flex-wrap gap-3"><button className="rounded-full bg-vijaya-red px-7 py-3 font-bold text-white">Save Changes</button><a href="/admin" className="rounded-full border-2 border-vijaya-red px-7 py-2.5 font-bold text-vijaya-red">Cancel</a></div>
    </form>
  </section>;
}
