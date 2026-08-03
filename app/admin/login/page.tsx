import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Login", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const { error } = await searchParams;
  return <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-14">
    <div className="w-full max-w-md rounded-4xl bg-white p-7 shadow-card sm:p-10">
      <Image src="/assets/images/brand/vijaya-premix-logo.jpeg" alt="Vijaya Premix" width={72} height={72} className="mx-auto h-[72px] w-[72px] rounded-full bg-white object-contain" priority unoptimized />
      <p className="mt-5 text-center text-xs font-extrabold uppercase tracking-[0.2em] text-vijaya-gold">Vijaya Premix Admin</p>
      <h1 className="mt-2 text-center font-display text-4xl font-bold text-vijaya-red">Admin Login</h1>
      <p className="mt-2 text-center text-sm text-vijaya-muted">Authorized administrators only.</p>
      {error && <p role="alert" className="mt-5 rounded-2xl bg-vijaya-pink px-4 py-3 text-center text-sm font-bold text-vijaya-red">Invalid email or password.</p>}
      <form action="/admin/auth/login" method="post" className="mt-7 space-y-5">
        <div><label htmlFor="admin-email" className="mb-1.5 block text-sm font-bold">Email</label><input id="admin-email" name="email" type="email" required maxLength={254} autoComplete="username" className="w-full rounded-2xl border border-vijaya-red/20 bg-white px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vijaya-red" /></div>
        <div><label htmlFor="admin-password" className="mb-1.5 block text-sm font-bold">Password</label><input id="admin-password" name="password" type="password" required maxLength={128} autoComplete="current-password" className="w-full rounded-2xl border border-vijaya-red/20 bg-white px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vijaya-red" /></div>
        <button type="submit" className="w-full rounded-full bg-vijaya-red py-3.5 font-display font-bold text-white transition hover:bg-vijaya-red2 active:scale-95">Sign In</button>
      </form>
    </div>
  </section>;
}
