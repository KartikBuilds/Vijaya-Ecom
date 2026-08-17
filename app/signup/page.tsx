import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/AuthForms";
import { getCustomerSession } from "@/lib/auth/customer";

export const metadata: Metadata = { title: "Create Account", description: "Create a Vijaya Premix customer account.", alternates: { canonical: "/signup" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCustomerSession()) redirect("/");
  const params = await searchParams;
  return <section className="mx-auto max-w-lg px-4 py-14"><div className="rounded-4xl bg-white p-7 shadow-card sm:p-10"><p className="mb-2 text-center text-xs font-extrabold uppercase tracking-wider text-vijaya-gold">Customer account</p><h1 className="mb-2 text-center font-display text-4xl font-bold text-vijaya-red">Create Account</h1><p className="mb-8 text-center text-sm text-vijaya-muted">Your account is stored securely with server-side authentication.</p><SignupForm error={params.error} /></div></section>;
}
