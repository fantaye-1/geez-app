"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown instead of a blank screen when a page throws while rendering.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-3xl text-ink">Something went wrong</h1>
      <p className="mt-3 text-ink/75" role="alert">
        This page hit an unexpected error. Your saved progress is safe.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-ink/60">Error reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border-2 border-border px-5 py-2 font-display text-ink hover:border-gold"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
