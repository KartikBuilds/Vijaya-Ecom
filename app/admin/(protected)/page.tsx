import type { Metadata } from "next";
import Link from "next/link";
import { ProductStatus, RecipeStatus, ReviewStatus, CustomerStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function Page() {
  const [published, drafts, scheduled, preorders, pendingReviews, publishedReviews, recipes, scheduledRecipes, customers, blockedCustomers, unreadNotifications, productViews, cartAdds, whatsAppClicks, activity] = await Promise.all([
    db.product.count({ where: { status: ProductStatus.PUBLISHED } }),
    db.product.count({ where: { status: ProductStatus.DRAFT } }),
    db.product.count({ where: { status: ProductStatus.SCHEDULED } }),
    db.product.count({ where: { status: ProductStatus.PUBLISHED, preorder: true } }),
    db.review.count({ where: { status: { in: [ReviewStatus.PENDING, ReviewStatus.DRAFT, ReviewStatus.APPROVED] } } }),
    db.review.count({ where: { status: ReviewStatus.PUBLISHED } }),
    db.recipe.count({ where: { status: RecipeStatus.PUBLISHED } }),
    db.recipe.count({ where: { status: RecipeStatus.SCHEDULED } }),
    db.customer.count(),
    db.customer.count({ where: { status: CustomerStatus.BLOCKED } }),
    db.notification.count({ where: { readAt: null } }),
    db.analyticsEvent.count({ where: { type: "PRODUCT_VIEW" } }),
    db.analyticsEvent.count({ where: { type: "ADD_TO_CART" } }),
    db.analyticsEvent.count({ where: { type: "WHATSAPP_CLICK" } }),
    db.auditLog.findMany({ include: { admin: { select: { displayName: true, username: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const cards = [[published, "Products Published"], [drafts, "Product Drafts"], [scheduled, "Scheduled Products"], [preorders, "Preorders"], [pendingReviews, "Reviews Pending"], [publishedReviews, "Published Reviews"], [recipes, "Recipes"], [scheduledRecipes, "Scheduled Recipes"], [customers, "Customers"], [blockedCustomers, "Blocked Customers"], [unreadNotifications, "Unread Notifications"], [productViews, "Product Views"], [cartAdds, "Cart Adds"], [whatsAppClicks, "WhatsApp Clicks"]];
  return <section className="space-y-6"><div className="rounded-4xl bg-white p-7 shadow-soft"><p className="text-xs font-bold uppercase tracking-widest text-vijaya-gold">Vijaya Premix Admin</p><h1 className="font-display text-4xl font-bold text-vijaya-red">Dashboard</h1><p className="text-sm text-vijaya-muted">Internal management overview for products, content, moderation, customers, analytics, and security.</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">{cards.map(([count, label]) => <article key={label} className="rounded-3xl bg-white p-4 text-center shadow-soft"><p className="font-display text-3xl font-bold text-vijaya-red">{count}</p><p className="text-xs font-bold text-vijaya-muted">{label}</p></article>)}</div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Products", "/admin/products"], ["Reviews", "/admin/reviews"], ["Recipes", "/admin/recipes"], ["Homepage", "/admin/homepage"], ["Media", "/admin/media"], ["Customers", "/admin/customers"], ["Analytics", "/admin/analytics"], ["Settings", "/admin/settings"]].map(([label, href]) => <Link key={href} href={href} className="rounded-4xl bg-white p-6 font-display text-xl font-bold shadow-soft transition hover:-translate-y-1 hover:text-vijaya-red">Manage {label}</Link>)}</div><div className="rounded-4xl bg-white p-6 shadow-soft"><h2 className="font-display text-2xl font-bold text-vijaya-red">Recent Activity</h2>{activity.length ? <ul className="mt-3 divide-y divide-vijaya-red/10">{activity.map((item) => <li key={item.id} className="py-3 text-sm"><p className="font-bold">{item.summary}</p><p className="text-xs text-vijaya-muted">{item.createdAt.toLocaleString("en-IN")}</p></li>)}</ul> : <p className="mt-3 text-sm text-vijaya-muted">No activity recorded yet.</p>}</div></section>;
}
