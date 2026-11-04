"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { displayName, useUser } from "@/lib/useUser";

export default function SiteHeader() {
  const { user, loading } = useUser();

  return (
    <header className="border-b border-border bg-card/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-lg text-ink hover:text-rubric">
          <span className="font-ethiopic">ግዕዝ</span> Learn Ge&apos;ez
        </Link>

        {/* Hidden entirely when Supabase isn't set up — lessons still work. */}
        {supabase && !loading && (
          <nav className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span
                  className="max-w-[12rem] truncate text-ink/70"
                  title={user.email ?? undefined}
                >
                  {displayName(user)}
                </span>
                <button
                  type="button"
                  onClick={() => supabase?.auth.signOut()}
                  className="rounded-md border border-border px-3 py-1.5 text-ink hover:border-gold"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-rubric px-3 py-1.5 text-parchment hover:bg-rubric/90"
              >
                Sign in
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
