"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FIDEL_LETTERS } from "@/lib/fidel";
import { fetchScriptProgress, type ProgressMap } from "@/lib/progress";
import { isDue, localDate } from "@/lib/srs";
import { displayName, useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabaseClient";

type Lesson = {
  title: string;
  ethiopic: string;
  description: string;
  href?: string;
};

const LESSONS: Lesson[] = [
  {
    title: "The Fidel",
    ethiopic: "ሀ ለ ሐ",
    description: "All 26 letter families and their seven vowel forms. Tap any letter to see its sound.",
    href: "/learn/script",
  },
  {
    title: "Fidel practice",
    ethiopic: "ሁ ሉ ሑ",
    description: "Quick 10-question rounds. Letters you miss come back sooner, letters you know come back later.",
    href: "/learn/script/practice",
  },
  {
    title: "Vocabulary",
    ethiopic: "ቃል",
    description: "Core words from prayer, scripture and everyday use.",
  },
  {
    title: "Grammar",
    ethiopic: "ሰዋስው",
    description: "How Ge'ez words are built and how sentences fit together.",
  },
  {
    title: "Reading",
    ethiopic: "ንባብ",
    description: "Short classical texts, read line by line with help.",
  },
];

export default function Home() {
  const { user } = useUser();
  const [progress, setProgress] = useState<ProgressMap | null>(null);

  useEffect(() => {
    setProgress(null);
    if (!user) return;
    let active = true;
    fetchScriptProgress(user.id)
      .then((map) => active && setProgress(map))
      .catch(() => {}); // the home page works without it
    return () => {
      active = false;
    };
  }, [user]);

  const today = localDate();
  const mastered = progress
    ? [...progress.values()].filter((s) => s.status === "mastered").length
    : 0;
  const due = progress ? [...progress.values()].filter((s) => isDue(s, today)).length : 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Hero */}
      <section className="text-center">
        <p className="font-ethiopic text-6xl text-rubric sm:text-7xl">ግዕዝ</p>
        <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">
          Learn Ge&apos;ez
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink/80">
          Ge&apos;ez is the classical language of Ethiopia and Eritrea — the
          language of the Ethiopian and Eritrean Orthodox liturgy and of
          centuries of literature. Its script, the Fidel, is still used to
          write Amharic and Tigrinya today. Start with the letters, free.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/learn/script"
            className="rounded-md bg-rubric px-6 py-3 font-display text-lg text-parchment hover:bg-rubric/90"
          >
            Start with the Fidel <span className="font-ethiopic">ሀ ለ ሐ</span>
          </Link>
          <Link
            href="/learn/script/practice"
            className="rounded-md border-2 border-border px-6 py-3 font-display text-lg text-ink hover:border-gold"
          >
            Practice
          </Link>
        </div>
      </section>

      {/* Progress, or an invitation to sign in */}
      {supabase && (
        <section
          className="mx-auto mt-12 max-w-2xl rounded-lg border border-border bg-card p-5 text-center"
          data-testid="home-progress"
        >
          {user ? (
            progress ? (
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:text-left">
                <div>
                  <p className="font-display text-lg text-ink">
                    Welcome back, {displayName(user)}
                  </p>
                  <p className="font-mono text-xs text-ink/70">
                    {mastered} of {FIDEL_LETTERS.length} letters mastered · {due} due for
                    review
                  </p>
                </div>
                <Link
                  href="/learn/script/practice"
                  className="shrink-0 rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90"
                >
                  {due > 0 ? `Review ${due} letter${due === 1 ? "" : "s"}` : "Keep practicing"}
                </Link>
              </div>
            ) : (
              <p className="font-display text-lg text-ink">
                Welcome back, {displayName(user)}
              </p>
            )
          ) : (
            <p className="text-ink/80">
              <Link href="/login" className="text-rubric underline">
                Sign in
              </Link>{" "}
              to save your progress and get letters back for review at the right
              time. No password needed.
            </p>
          )}
        </section>
      )}

      {/* Lessons */}
      <section className="mt-14">
        <h2 className="font-display text-2xl text-ink">Lessons</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LESSONS.map((lesson) => {
            const body = (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-xl text-ink">{lesson.title}</h3>
                  {!lesson.href && (
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink/60">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="mt-2 font-ethiopic text-3xl text-rubric/90">{lesson.ethiopic}</p>
                <p className="mt-3 text-sm text-ink/75">{lesson.description}</p>
              </>
            );
            return (
              <li key={lesson.title}>
                {lesson.href ? (
                  <Link
                    href={lesson.href}
                    className="block h-full rounded-lg border border-border bg-card p-5 transition-colors hover:border-gold"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="h-full rounded-lg border border-dashed border-border p-5 opacity-75">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
