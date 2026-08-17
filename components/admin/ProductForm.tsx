"use client";
/* eslint-disable @next/next/no-img-element -- admin preview accepts validated arbitrary HTTP(S) URLs without a broad Next Image allowlist */
import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { ProductFormState } from "@/lib/products/validation";
import { normalizeSlug } from "@/lib/products/slug";

export type ProductFormValue = {
  name: string; slug: string; categoryId: string; shortDescription: string; description: string; imagePath: string;
  price: string; compareAtPrice: string; preparationTime: string; servings: string; status: ProductStatusValue;
  pinned: boolean; featured: boolean; preorder: boolean; preorderMessage: string; expectedDispatch: string; publishAt: string; unpublishAt: string; sortOrder: number; seoTitle: string; seoDescription: string;
};
type Action = (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
const empty: ProductFormValue = { name: "", slug: "", categoryId: "", shortDescription: "", description: "", imagePath: "", price: "", compareAtPrice: "", preparationTime: "", servings: "", status: "DRAFT", pinned: false, featured: false, preorder: false, preorderMessage: "", expectedDispatch: "", publishAt: "", unpublishAt: "", sortOrder: 0, seoTitle: "", seoDescription: "" };

function FieldError({ errors, name }: { errors?: Record<string, string[]>; name: string }) {
  const messages = errors?.[name];
  return messages?.length ? <p id={`${name}-error`} className="mt-1.5 text-xs font-bold text-vijaya-red">{messages[0]}</p> : null;
}
function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-full bg-vijaya-red px-7 py-3 font-display font-bold text-white transition hover:bg-vijaya-red2 disabled:cursor-wait disabled:opacity-60">{pending ? "Saving…" : editing ? "Save Changes" : "Save Product"}</button>;
}
const inputClass = "w-full rounded-2xl border border-vijaya-red/20 bg-white px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-vijaya-red";

export function ProductForm({ action, categories, product }: { action: Action; categories: { id: string; name: string }[]; product?: ProductFormValue }) {
  const initial = product ?? empty;
  const [state, formAction] = useFormState(action, {});
  const [name, setName] = useState(initial.name), [slug, setSlug] = useState(initial.slug), [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [imagePath, setImagePath] = useState(initial.imagePath), [imageFailed, setImageFailed] = useState(false);
  const describedBy = (field: string) => state.errors?.[field] ? `${field}-error` : undefined;
  return <form action={formAction} className="space-y-7" noValidate>
    {state.message && <div role="alert" className="rounded-2xl bg-vijaya-pink px-4 py-3 text-sm font-bold text-vijaya-red">{state.message}</div>}
    <fieldset className="rounded-4xl bg-white p-6 shadow-soft"><legend className="px-2 font-display text-xl font-bold text-vijaya-red">Product Information</legend><div className="mt-3 grid gap-5 sm:grid-cols-2">
      <div><label htmlFor="name" className="mb-1.5 block text-sm font-bold">Product Name *</label><input id="name" name="name" value={name} onChange={(event) => { const value = event.target.value; setName(value); if (!slugEdited) setSlug(normalizeSlug(value)); }} maxLength={120} required aria-invalid={Boolean(state.errors?.name)} aria-describedby={describedBy("name")} className={inputClass}/><FieldError errors={state.errors} name="name"/></div>
      <div><label htmlFor="slug" className="mb-1.5 block text-sm font-bold">Slug *</label><input id="slug" name="slug" value={slug} onChange={(event) => { setSlug(event.target.value); setSlugEdited(true); }} maxLength={160} required aria-invalid={Boolean(state.errors?.slug)} aria-describedby={describedBy("slug")} className={inputClass}/><FieldError errors={state.errors} name="slug"/></div>
      <div><label htmlFor="categoryId" className="mb-1.5 block text-sm font-bold">Category *</label><select id="categoryId" name="categoryId" defaultValue={initial.categoryId} required aria-invalid={Boolean(state.errors?.categoryId)} aria-describedby={describedBy("categoryId")} className={inputClass}><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><FieldError errors={state.errors} name="categoryId"/></div>
      <div className="sm:col-span-2"><label htmlFor="shortDescription" className="mb-1.5 block text-sm font-bold">Short Description</label><textarea id="shortDescription" name="shortDescription" defaultValue={initial.shortDescription} maxLength={300} rows={2} className={inputClass}/><FieldError errors={state.errors} name="shortDescription"/></div>
      <div className="sm:col-span-2"><label htmlFor="description" className="mb-1.5 block text-sm font-bold">Full Description</label><textarea id="description" name="description" defaultValue={initial.description} maxLength={10000} rows={6} className={inputClass}/><FieldError errors={state.errors} name="description"/></div>
    </div></fieldset>
    <fieldset className="rounded-4xl bg-white p-6 shadow-soft"><legend className="px-2 font-display text-xl font-bold text-vijaya-red">Pricing</legend><div className="mt-3 grid gap-5 sm:grid-cols-2">{[["price","Price"],["compareAtPrice","Compare-at Price"]].map(([field,label]) => <div key={field}><label htmlFor={field} className="mb-1.5 block text-sm font-bold">{label}</label><input id={field} name={field} type="text" inputMode="decimal" defaultValue={initial[field as "price"|"compareAtPrice"]} placeholder="Price on request" aria-invalid={Boolean(state.errors?.[field])} aria-describedby={describedBy(field)} className={inputClass}/><FieldError errors={state.errors} name={field}/></div>)}</div></fieldset>
    <fieldset className="rounded-4xl bg-white p-6 shadow-soft"><legend className="px-2 font-display text-xl font-bold text-vijaya-red">Product Details</legend><div className="mt-3 grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2"><label htmlFor="imagePath" className="mb-1.5 block text-sm font-bold">Product Image *</label><input id="imagePath" name="imagePath" value={imagePath} onChange={(event) => { setImagePath(event.target.value); setImageFailed(false); }} required placeholder="/assets/images/products/example.jpeg or https://…" aria-invalid={Boolean(state.errors?.imagePath)} aria-describedby={describedBy("imagePath")} className={inputClass}/><p className="mt-1.5 text-xs text-vijaya-muted">Use an existing public asset path or externally hosted HTTP(S) image URL. Upload storage is not configured.</p><FieldError errors={state.errors} name="imagePath"/>{imagePath && <div className="mt-4 flex h-48 items-center justify-center rounded-3xl bg-vijaya-pink p-4">{imageFailed ? <p className="text-sm font-bold text-vijaya-muted">Image preview unavailable</p> : <img src={imagePath} alt="Product artwork preview" className="h-full w-full object-contain" onError={() => setImageFailed(true)}/>}</div>}</div>
      <div><label htmlFor="preparationTime" className="mb-1.5 block text-sm font-bold">Preparation Time</label><input id="preparationTime" name="preparationTime" defaultValue={initial.preparationTime} placeholder="15–20 Minutes" maxLength={100} className={inputClass}/><FieldError errors={state.errors} name="preparationTime"/></div>
      <div><label htmlFor="servings" className="mb-1.5 block text-sm font-bold">Servings</label><input id="servings" name="servings" defaultValue={initial.servings} placeholder="Serves 4–5" maxLength={100} className={inputClass}/><FieldError errors={state.errors} name="servings"/></div>
    </div></fieldset>
    <fieldset className="rounded-4xl bg-white p-6 shadow-soft"><legend className="px-2 font-display text-xl font-bold text-vijaya-red">Visibility</legend><div className="mt-3 grid gap-5 sm:grid-cols-2">
      <div><label htmlFor="status" className="mb-1.5 block text-sm font-bold">Status</label><select id="status" name="status" defaultValue={initial.status} className={inputClass}>{productStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
      <div><label htmlFor="sortOrder" className="mb-1.5 block text-sm font-bold">Sort Order</label><input id="sortOrder" name="sortOrder" type="number" defaultValue={initial.sortOrder} min={-9999} max={9999} className={inputClass}/><FieldError errors={state.errors} name="sortOrder"/></div>
      <div><label htmlFor="publishAt" className="mb-1.5 block text-sm font-bold">Publish At</label><input id="publishAt" name="publishAt" type="datetime-local" defaultValue={initial.publishAt} className={inputClass}/><FieldError errors={state.errors} name="publishAt"/></div>
      <div><label htmlFor="unpublishAt" className="mb-1.5 block text-sm font-bold">Unpublish At</label><input id="unpublishAt" name="unpublishAt" type="datetime-local" defaultValue={initial.unpublishAt} className={inputClass}/><FieldError errors={state.errors} name="unpublishAt"/></div>
      <label className="flex items-center gap-3 rounded-2xl bg-vijaya-offwhite p-4 text-sm font-bold"><input name="pinned" type="checkbox" defaultChecked={initial.pinned} className="h-5 w-5 accent-vijaya-red"/>Pinned Product</label>
      <label className="flex items-center gap-3 rounded-2xl bg-vijaya-offwhite p-4 text-sm font-bold"><input name="featured" type="checkbox" defaultChecked={initial.featured} className="h-5 w-5 accent-vijaya-red"/>Featured Product</label>
      <label className="flex items-center gap-3 rounded-2xl bg-vijaya-offwhite p-4 text-sm font-bold"><input name="preorder" type="checkbox" defaultChecked={initial.preorder} className="h-5 w-5 accent-vijaya-red"/>Enable Preorder</label>
      <div><label htmlFor="preorderMessage" className="mb-1.5 block text-sm font-bold">Preorder Message</label><input id="preorderMessage" name="preorderMessage" defaultValue={initial.preorderMessage} maxLength={300} className={inputClass}/><FieldError errors={state.errors} name="preorderMessage"/></div>
      <div><label htmlFor="expectedDispatch" className="mb-1.5 block text-sm font-bold">Expected Dispatch</label><input id="expectedDispatch" name="expectedDispatch" defaultValue={initial.expectedDispatch} maxLength={120} className={inputClass}/><FieldError errors={state.errors} name="expectedDispatch"/></div>
    </div></fieldset>
    <fieldset className="rounded-4xl bg-white p-6 shadow-soft"><legend className="px-2 font-display text-xl font-bold text-vijaya-red">SEO</legend><div className="mt-3 space-y-5"><div><label htmlFor="seoTitle" className="mb-1.5 block text-sm font-bold">SEO Title</label><input id="seoTitle" name="seoTitle" defaultValue={initial.seoTitle} maxLength={200} className={inputClass}/><p className="mt-1 text-xs text-vijaya-muted">Aim for a concise search title; up to 200 characters are accepted.</p><FieldError errors={state.errors} name="seoTitle"/></div><div><label htmlFor="seoDescription" className="mb-1.5 block text-sm font-bold">SEO Description</label><textarea id="seoDescription" name="seoDescription" defaultValue={initial.seoDescription} maxLength={600} rows={3} className={inputClass}/><p className="mt-1 text-xs text-vijaya-muted">Write a useful summary for future storefront metadata.</p><FieldError errors={state.errors} name="seoDescription"/></div></div></fieldset>
    <div className="flex flex-wrap items-center gap-3"><SaveButton editing={Boolean(product)}/><Link href="/admin/products" className="rounded-full border-2 border-vijaya-red px-7 py-2.5 font-bold text-vijaya-red">Cancel</Link></div>
  </form>;
}
const productStatuses = ["DRAFT", "SCHEDULED", "PUBLISHED", "HIDDEN", "ARCHIVED"] as const;
type ProductStatusValue = typeof productStatuses[number];
