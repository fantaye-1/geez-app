"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { displayName, useUser } from "@/lib/useUser";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export default function LoginPage() {
  const { user, loading } = useUser();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    const address = email.trim();
    setStatus({ kind: "sending" });
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      // Bring them back to the home page; supabase-js picks the session
      // out of the link automatically. This URL must be listed in
      // Supabase → Authentication → URL Configuration.
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setStatus(
      error
        ? { kind: "error", message: error.message }
        : { kind: "sent", email: address }
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl text-ink">Sign in</h1>
      <p className="mt-2 text-ink/80">
        Sign in to save your progress. The lessons work without an account too.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        {!supabase ? (
          <p className="text-ink/80">
            Sign-in isn&apos;t set up on this copy of the app yet. Add your
            Supabase keys to <code className="font-mono text-sm">.env.local</code>{" "}
            (see <code className="font-mono text-sm">.env.example</code>).
          </p>
        ) : loading ? (
          <p className="text-ink/60">Checking…</p>
        ) : user ? (
          <div className="space-y-4">
            <p className="text-ink">
              You&apos;re signed in as <strong>{displayName(user)}</strong>.
            </p>
            <Link
              href="/learn/script"
              className="inline-block rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90"
            >
              Go to the Fidel
            </Link>
          </div>
        ) : status.kind === "sent" ? (
          <div className="space-y-3" role="status">
            <p className="font-display text-xl text-ink">Check your email</p>
            <p className="text-ink/80">
              We sent a sign-in link to <strong>{status.email}</strong>. Open it on
              this device to finish signing in.
            </p>
            <button
              type="button"
              onClick={() => setStatus({ kind: "idle" })}
              className="text-sm text-rubric underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-4">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-wide text-ink/60">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-md border border-border bg-parchment px-3 py-2 text-ink focus:border-gold focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={status.kind === "sending"}
              className="w-full rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90 disabled:opacity-60"
            >
              {status.kind === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
            {status.kind === "error" && (
              <p className="text-sm text-rubric" role="alert">
                {status.message}
              </p>
            )}
            <p className="text-xs text-ink/60">
              No password needed. New here? The same link creates your account.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
