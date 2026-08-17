import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "../actions";
export const metadata: Metadata = { title: "Create Product | Admin" };
export default async function NewProductPage() { await requirePermission("products:write"); const categories = await db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }); return <section className="max-w-4xl"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-vijaya-gold">Product CMS</p><h1 className="mt-1 font-display text-4xl font-bold text-vijaya-red">Create Product</h1><p className="mb-7 mt-1 text-sm text-vijaya-muted">Create a database product. Published products appear on the storefront.</p><ProductForm action={createProduct} categories={categories}/></section>; }
