"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // We intentionally don't expose stack traces.
    console.error("Application error:", error.digest);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <div className="text-center">
        <p className="text-sm font-extrabold tracking-widest text-vijaya-gold uppercase">500 Error</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-vijaya-dark md:text-5xl">Something went wrong</h1>
        <p className="mt-4 text-vijaya-muted max-w-md mx-auto">
          We encountered an unexpected error processing your request. Please try again.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button onClick={() => reset()} className="rounded-full bg-vijaya-red px-8 py-3 font-bold text-white transition hover:bg-vijaya-red2">
            Try Again
          </button>
          <Link href="/" className="rounded-full border-2 border-vijaya-red px-8 py-3 font-bold text-vijaya-red transition hover:bg-vijaya-pink">
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
