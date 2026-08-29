"use client";

import Link from "next/link";
import { useStore } from "@/components/storefront/StoreProvider";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { PublicProduct } from "@/lib/products/public-types";

export function WishlistClient({ allProducts }: { allProducts: PublicProduct[] }) {
  const { wishlist, hydrated } = useStore();

  if (!hydrated) {
    return <div className="py-20 text-center"><p className="text-vijaya-muted text-sm font-bold animate-pulse">Loading wishlist...</p></div>;
  }

  const savedProducts = allProducts.filter(p => wishlist.includes(p.id));

  if (savedProducts.length === 0) {
    return (
      <div className="rounded-4xl bg-white p-12 text-center shadow-soft">
        <p className="font-display text-2xl font-bold text-vijaya-dark">Your wishlist is empty</p>
        <p className="mt-3 text-vijaya-muted">You haven&apos;t saved any premixes yet.</p>
        <Link href="/products" className="mt-6 inline-block rounded-full bg-vijaya-red px-8 py-3 font-bold text-white transition hover:bg-vijaya-red2">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {savedProducts.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
