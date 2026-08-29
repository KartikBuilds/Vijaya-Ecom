import type { Metadata } from "next";
import { WishlistClient } from "./WishlistClient";
import { getPublishedProducts } from "@/lib/products/public";

export const metadata: Metadata = {
  title: "My Wishlist | Vijaya Premix",
  description: "View your saved Vijaya Premix products.",
};

export default async function WishlistPage() {
  // We can pass all products and let the client filter them by saved IDs.
  // getPublishedProducts() is fast and cached by Next.js
  const products = await getPublishedProducts();
  
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl font-bold text-vijaya-dark md:text-5xl">My Wishlist</h1>
        <p className="mt-4 text-vijaya-muted">Your saved premixes for convenient home cooking.</p>
      </div>
      <WishlistClient allProducts={products} />
    </main>
  );
}
