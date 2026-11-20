"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FIDEL_LETTERS } from "@/lib/fidel";
import { fetchScriptProgress, type ProgressMap } from "@/lib/progress";
import { summarizeProgress } from "@/lib/progressSummary";
import { localDate } from "@/lib/srs";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";

type Load =
  | { kind: "loading" }
  | { kind: "ready"; progress: ProgressMap }
  | { kind: "error"; message: string };

export default function ProgressPage() {
  const { user, loading: userLoading } = useUser();
  const [load, setLoad] = useState<Load>({ kind: "loading" });

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoad({ kind: "loading" });
    fetchScriptProgress(user.id)
      .then((progress) => active && setLoad({ kind: "ready", progress }))
      .catch((e) =>
        active &&
        setLoad({
          kind: "error",
          message: e instanceof Error ? e.message : "Something went wrong.",
        })
      );
    return () => {
      active = false;
    };
  }, [user]);

  const today = localDate();
  const summary = useMemo(
    () => (load.kind === "ready" ? summarizeProgress(FIDEL_LETTERS, load.progress, today) : null),
    [load, today]
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl text-ink sm:text-4xl">Your progress</h1>
      <p className="mt-2 text-ink/75">How far you are through the Fidel, and what&apos;s coming up for review.</p>

      {!supabase ? (
        <Notice>Saving progress isn&apos;t set up on this site, so there&apos;s nothing to show yet.</Notice>
      ) : userLoading ? (
        <Notice>Loading…</Notice>
      ) : !user ? (
        <Notice>
          <Link href="/login" className="text-rubric underline">
            Sign in
          </Link>{" "}
          to save your answers and see your progress here.
        </Notice>
      ) : load.kind === "error" ? (
        <Notice role="alert">Couldn&apos;t load your progress: {load.message}</Notice>
      ) : !summary ? (
        <Notice>Loading your progress…</Notice>
      ) : (
        <>
          {/* Headline numbers */}
          <section aria-label="Summary" className="mt-8">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-display text-xl text-ink">
                {summary.mastered} of {summary.total} letters mastered
              </p>
              <p className="font-mono text-sm text-ink/70">{summary.percentMastered}%</p>
            </div>
            <div
              className="mt-2 flex h-3 overflow-hidden rounded-full bg-border/60"
              role="img"
              aria-label={`${summary.mastered} mastered, ${summary.learning} learning, ${summary.notStarted} not started`}
            >
              <div className="bg-gold" style={{ width: `${(summary.mastered / summary.total) * 100}%` }} />
              <div className="bg-rubric/60" style={{ width: `${(summary.learning / summary.total) * 100}%` }} />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Mastered" value={summary.mastered} swatch="bg-gold" />
              <Stat label="Learning" value={summary.learning} swatch="bg-rubric/60" />
              <Stat label="Due today" value={summary.dueToday} />
              <Stat label="Due this week" value={summary.dueThisWeek} />
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/learn/script/practice"
                className="rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90"
              >
                {summary.dueToday > 0
                  ? `Review ${summary.dueToday} letter${summary.dueToday === 1 ? "" : "s"}`
                  : summary.learning + summary.mastered === 0
                    ? "Start practicing"
                    : "Keep practicing"}
              </Link>
              <Link
                href="/learn/script"
                className="rounded-md border-2 border-border px-5 py-2 font-display text-ink hover:border-gold"
              >
                Open the Fidel chart
              </Link>
            </div>
          </section>

          {/* Per family */}
          <section className="mt-12">
            <h2 className="font-display text-2xl text-ink">By letter family</h2>
            <p className="mt-1 text-sm text-ink/70">
              Each dot is one vowel form. Tap a letter to open it in the chart.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary.families.map((fam) => {
                const letters = FIDEL_LETTERS.filter((l) => l.family.id === fam.family.id);
                return (
                  <li key={fam.family.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-lg text-ink">
                        <span className="font-ethiopic text-rubric" lang="gez">
                          {letters[0].char}
                        </span>{" "}
                        {fam.family.name}
                      </h3>
                      <span className="font-mono text-xs text-ink/70">
                        {fam.mastered}/{fam.total} mastered
                        {fam.due > 0 && ` · ${fam.due} due`}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      {letters.map((l) => {
                        const s = load.kind === "ready" ? load.progress.get(l.id) : undefined;
                        const status = !s ? "not started" : s.status;
                        const tone = !s
                          ? "border-border text-ink/50"
                          : s.status === "mastered"
                            ? "border-gold bg-gold/20 text-ink"
                            : "border-rubric/50 bg-rubric/10 text-ink";
                        return (
                          <Link
                            key={l.id}
                            href={`/learn/script?letter=${l.id}`}
                            lang="gez"
                            aria-label={`${l.char} (${l.sound}): ${status}`}
                            title={`${l.sound} · ${status}`}
                            className={`flex h-9 w-9 items-center justify-center rounded border font-ethiopic text-lg hover:border-ink ${tone}`}
                          >
                            {l.char}
                          </Link>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

function Notice({ children, role }: { children: React.ReactNode; role?: "alert" }) {
  return (
    <p role={role} className="mt-8 rounded-lg border border-border bg-card p-5 text-ink/80">
      {children}
    </p>
  );
}

function Stat({ label, value, swatch }: { label: string; value: number; swatch?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <dt className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-ink/70">
        {swatch && <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${swatch}`} />}
        {label}
      </dt>
      <dd className="mt-1 font-display text-3xl text-ink">{value}</dd>
    </div>
  );
}
