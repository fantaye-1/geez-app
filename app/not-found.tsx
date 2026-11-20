import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <p className="font-mono text-sm text-ink/60">404</p>
      <h1 className="mt-2 font-display text-3xl text-ink">This page doesn&apos;t exist</h1>
      <p className="mt-3 text-ink/75">
        The link may be old or mistyped. The lessons are all reachable from the home page.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90"
        >
          Go home
        </Link>
        <Link
          href="/learn/script"
          className="rounded-md border-2 border-border px-5 py-2 font-display text-ink hover:border-gold"
        >
          Fidel chart
        </Link>
      </div>
    </main>
  );
}
