import type { Metadata } from "next";
import { FeedbackStatus } from "@prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { updateFeedback } from "./actions";

export const metadata: Metadata = { title: "Feedback | Admin" };

export default async function FeedbackPage() {
  await requirePermission("feedback:write");
  const items = await db.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return <section className="space-y-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Customer Inquiries</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Feedback</h1><p className="text-sm text-vijaya-muted">General inquiries, product questions, complaints, and business messages.</p></div><div className="rounded-4xl bg-white p-4 shadow-soft">{items.length ? <div className="divide-y divide-vijaya-red/10">{items.map((item) => <article key={item.id} className="grid gap-4 py-5 lg:grid-cols-[1fr_360px]"><div><p className="text-xs font-bold text-vijaya-gold">{item.category} · {item.status}</p><h2 className="font-display text-xl font-bold">{item.subject}</h2><p className="mt-2 text-sm text-vijaya-muted">{item.message}</p><p className="mt-2 text-xs text-vijaya-muted">{item.name ?? "Anonymous"} · {item.email ?? "No email"} · {item.createdAt.toLocaleString("en-IN")}</p></div><form action={updateFeedback} className="space-y-2"><input type="hidden" name="id" value={item.id} /><select name="status" defaultValue={item.status} className="w-full rounded-2xl border px-4 py-3 text-sm">{Object.values(FeedbackStatus).map((status) => <option key={status} value={status}>{status}</option>)}</select><textarea name="internalNotes" defaultValue={item.internalNotes ?? ""} placeholder="Internal notes" rows={3} className="w-full rounded-2xl border px-4 py-3 text-sm" /><button className="rounded-full bg-vijaya-dark px-5 py-2.5 text-sm font-bold text-white">Save</button></form></article>)}</div> : <p className="p-8 text-center text-sm text-vijaya-muted">No feedback records yet.</p>}</div></section>;
}
