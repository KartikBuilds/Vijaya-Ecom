import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Content | Admin" };

const modules = [
  ["Products", "/admin/products", "Catalogue publishing, drafts, schedules, visibility, featured and pinned flags."],
  ["Recipes", "/admin/recipes", "Recipe drafts, video links, schedules, SEO, and product associations."],
  ["Reviews", "/admin/reviews", "Moderation, publishing, hiding, featuring, and pinning customer reviews."],
  ["Homepage", "/admin/homepage", "Structured hero, sections, promise, preorder, gallery and newsletter visibility."],
  ["Banners", "/admin/banners", "Campaign placements, schedules, CTAs, and global notices."],
  ["User Content", "/admin/ugc", "Customer cooking submissions and moderation workflow."],
] as const;

export default async function ContentPage() {
  await requirePermission("content:write");
  return <section className="space-y-6"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Publishing Workflow</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Content</h1><p className="text-sm text-vijaya-muted">Create, Draft, Preview, Publish, Hide, Archive, and Restore across supported content modules.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{modules.map(([title, href, description]) => <Link key={href} href={href} className="rounded-4xl bg-white p-6 shadow-soft transition hover:-translate-y-1"><h2 className="font-display text-2xl font-bold text-vijaya-red">{title}</h2><p className="mt-2 text-sm text-vijaya-muted">{description}</p></Link>)}</div></section>;
}
