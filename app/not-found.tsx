import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Vijaya Premix",
};

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <div className="text-center">
        <p className="text-sm font-extrabold tracking-widest text-vijaya-gold uppercase">404 Error</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-vijaya-dark md:text-5xl">Page Not Found</h1>
        <p className="mt-4 text-vijaya-muted max-w-md mx-auto">
          We couldn&apos;t find the page you were looking for. It might have been moved or removed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="rounded-full bg-vijaya-red px-8 py-3 font-bold text-white transition hover:bg-vijaya-red2">
            Go Home
          </Link>
          <Link href="/products" className="rounded-full border-2 border-vijaya-red px-8 py-3 font-bold text-vijaya-red transition hover:bg-vijaya-pink">
            Browse Products
          </Link>
          <Link href="/recipes" className="rounded-full border-2 border-vijaya-muted px-8 py-3 font-bold text-vijaya-muted transition hover:bg-gray-100">
            View Recipes
          </Link>
        </div>
      </div>
    </main>
  );
}
