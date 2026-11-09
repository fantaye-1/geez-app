"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FIDEL_LETTERS, type FidelLetter } from "@/lib/fidel";
import {
  LETTER_SETS,
  QUESTIONS_PER_ROUND,
  buildReviewRound,
  buildRound,
  type QuizDirection,
  type QuizQuestion,
} from "@/lib/fidelQuiz";
import {
  fetchScriptProgress,
  saveLetterProgress,
  type ProgressMap,
} from "@/lib/progress";
import { isDue, localDate, nextReview } from "@/lib/srs";
import { useUser } from "@/lib/useUser";

const CORRECT_DELAY_MS = 700;
const WRONG_DELAY_MS = 1600;

type Phase = "setup" | "playing" | "done";
/** One of LETTER_SETS, or the letters due for review */
type Mode = (typeof LETTER_SETS)[number]["id"] | "review";
type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function FidelPracticePage() {
  const { user } = useUser();
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>(LETTER_SETS[0].id);
  const [direction, setDirection] = useState<QuizDirection>("letter-to-sound");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<FidelLetter | null>(null);
  const [missed, setMissed] = useState<FidelLetter[]>([]);

  const question = questions[index];

  // Load saved progress whenever someone signs in (cleared on sign-out).
  useEffect(() => {
    setProgress(null);
    setLoadError(false);
    if (!user) return;
    let active = true;
    fetchScriptProgress(user.id)
      .then((map) => active && setProgress(map))
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [user]);

  const dueLetters = useMemo(() => {
    if (!progress) return [];
    const today = localDate();
    return FIDEL_LETTERS.filter((l) => {
      const s = progress.get(l.id);
      return s && isDue(s, today);
    });
  }, [progress]);

  // Nothing due any more (e.g. after signing out) → fall back to a set.
  useEffect(() => {
    if (mode === "review" && dueLetters.length === 0 && phase === "setup") {
      setMode(LETTER_SETS[0].id);
    }
  }, [mode, dueLetters.length, phase]);

  // After an answer, pause briefly on the feedback, then move on.
  useEffect(() => {
    if (!picked || !question) return;
    const correct = picked.id === question.answer.id;
    const timer = setTimeout(() => {
      setPicked(null);
      if (index + 1 < questions.length) setIndex(index + 1);
      else setPhase("done");
    }, correct ? CORRECT_DELAY_MS : WRONG_DELAY_MS);
    return () => clearTimeout(timer);
  }, [picked, question, index, questions.length]);

  function start() {
    // Questions are random, so build them on click (not during render)
    // to avoid a server/client hydration mismatch.
    const set = LETTER_SETS.find((s) => s.id === mode);
    setQuestions(set ? buildRound(set) : buildReviewRound(dueLetters));
    setIndex(0);
    setPicked(null);
    setMissed([]);
    setSaveStatus("idle");
    setPhase("playing");
  }

  function answer(choice: FidelLetter) {
    if (picked || !question) return;
    const correct = choice.id === question.answer.id;
    setPicked(choice);
    if (!correct) setMissed((m) => [...m, question.answer]);
    if (user && progress) record(user.id, question.answer, correct);
  }

  function record(userId: string, letter: FidelLetter, correct: boolean) {
    const { state, changed } = nextReview(
      progress?.get(letter.id) ?? null,
      correct,
      localDate()
    );
    if (!changed) return;
    setProgress((p) => new Map(p ?? []).set(letter.id, state));
    setSaveStatus("saving");
    saveLetterProgress(userId, letter.id, state)
      .then(() => setSaveStatus((s) => (s === "error" ? s : "saved")))
      .catch(() => setSaveStatus("error"));
  }

  const masteredCount = progress
    ? [...progress.values()].filter((s) => s.status === "mastered").length
    : 0;

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <Link
        href="/learn/script"
        className="font-mono text-xs text-ink/60 hover:text-rubric"
      >
        ← Fidel chart
      </Link>
      <h1 className="mt-4 font-display text-3xl text-ink">Fidel practice</h1>

      <ProgressNote
        signedIn={!!user}
        loaded={!!progress}
        loadError={loadError}
        saveStatus={saveStatus}
        masteredCount={masteredCount}
        dueCount={dueLetters.length}
      />

      {phase === "setup" && (
        <section className="mt-6 space-y-6">
          <fieldset>
            <legend className="font-mono text-xs uppercase tracking-wide text-ink/60">
              Letters
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {progress && (
                <Choice
                  active={mode === "review"}
                  disabled={dueLetters.length === 0}
                  onClick={() => setMode("review")}
                >
                  {dueLetters.length > 0
                    ? `Review due letters (${dueLetters.length})`
                    : "Nothing due today"}
                </Choice>
              )}
              {LETTER_SETS.map((s) => (
                <Choice key={s.id} active={mode === s.id} onClick={() => setMode(s.id)}>
                  <span className="font-ethiopic">{s.label}</span>
                </Choice>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-mono text-xs uppercase tracking-wide text-ink/60">
              Direction
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <Choice
                active={direction === "letter-to-sound"}
                onClick={() => setDirection("letter-to-sound")}
              >
                <span className="font-ethiopic">ሀ</span> → sound
              </Choice>
              <Choice
                active={direction === "sound-to-letter"}
                onClick={() => setDirection("sound-to-letter")}
              >
                sound → <span className="font-ethiopic">ሀ</span>
              </Choice>
            </div>
          </fieldset>

          <button
            type="button"
            onClick={start}
            className="rounded-md bg-rubric px-6 py-3 font-display text-lg text-parchment hover:bg-rubric/90"
          >
            Start —{" "}
            {mode === "review"
              ? Math.min(QUESTIONS_PER_ROUND, dueLetters.length)
              : QUESTIONS_PER_ROUND}{" "}
            questions
          </button>
        </section>
      )}

      {phase === "playing" && question && (
        <section className="mt-6">
          <div className="flex items-center justify-between font-mono text-xs text-ink/60">
            <span>
              Question {index + 1} of {questions.length}
            </span>
            <span>{index + (picked ? 1 : 0) - missed.length} correct</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/50">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${((index + (picked ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>

          <div className="mt-8 rounded-lg border border-border bg-card py-10 text-center">
            {direction === "letter-to-sound" ? (
              <span className="font-ethiopic text-8xl leading-none text-ink">
                {question.answer.char}
              </span>
            ) : (
              <span className="font-display text-6xl text-ink">
                {question.answer.sound}
              </span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="Answers">
            {question.choices.map((choice) => {
              const isAnswer = choice.id === question.answer.id;
              const isPicked = picked?.id === choice.id;
              let tone = "border-border bg-card text-ink hover:border-gold";
              if (picked && isAnswer) tone = "border-green-700 bg-green-700 text-parchment";
              else if (isPicked) tone = "border-rubric bg-rubric text-parchment";
              else if (picked) tone = "border-border bg-card text-ink/40";
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => answer(choice)}
                  disabled={!!picked}
                  className={`rounded-lg border-2 py-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${tone} ${
                    direction === "letter-to-sound"
                      ? "font-display text-2xl"
                      : "font-ethiopic text-4xl"
                  }`}
                >
                  {direction === "letter-to-sound" ? choice.sound : choice.char}
                </button>
              );
            })}
          </div>

          <p className="mt-4 h-6 text-center text-sm" aria-live="polite">
            {picked &&
              (picked.id === question.answer.id ? (
                <span className="text-green-800">Correct!</span>
              ) : (
                <span className="text-rubric">
                  It&apos;s <span className="font-ethiopic">{question.answer.char}</span>{" "}
                  — {question.answer.sound}
                </span>
              ))}
          </p>
        </section>
      )}

      {phase === "done" && (
        <section className="mt-6 rounded-lg border border-border bg-card p-6 text-center">
          <p className="font-display text-5xl text-ink">
            {questions.length - missed.length} / {questions.length}
          </p>
          <p className="mt-2 text-ink/70">
            {missed.length === 0
              ? "Perfect round!"
              : missed.length <= 3
              ? "Nice work — review these and go again."
              : "Keep practicing — these ones need another look."}
          </p>

          {missed.length > 0 && (
            <div className="mt-6">
              <p className="font-mono text-xs uppercase tracking-wide text-ink/60">
                Letters to review
              </p>
              <ul className="mt-3 flex flex-wrap justify-center gap-2">
                {missed.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/learn/script?letter=${l.id}`}
                      className="inline-flex flex-col items-center rounded-md border border-border px-3 py-2 hover:border-gold"
                    >
                      <span className="font-ethiopic text-3xl text-rubric">{l.char}</span>
                      <span className="font-mono text-xs text-ink/70">{l.sound}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={start}
              disabled={mode === "review" && dueLetters.length === 0}
              className="rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90 disabled:opacity-50"
            >
              Play again
            </button>
            <button
              type="button"
              onClick={() => setPhase("setup")}
              className="rounded-md border border-border px-5 py-2.5 font-display text-ink hover:border-gold"
            >
              Change settings
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function ProgressNote({
  signedIn,
  loaded,
  loadError,
  saveStatus,
  masteredCount,
  dueCount,
}: {
  signedIn: boolean;
  loaded: boolean;
  loadError: boolean;
  saveStatus: SaveStatus;
  masteredCount: number;
  dueCount: number;
}) {
  let text: React.ReactNode;
  if (!signedIn) {
    text = (
      <>
        <Link href="/login" className="text-rubric underline">
          Sign in
        </Link>{" "}
        to save your progress.
      </>
    );
  } else if (loadError) {
    text = <span className="text-rubric">Couldn&apos;t load your progress — practice still works, but answers won&apos;t be saved.</span>;
  } else if (!loaded) {
    text = "Loading your progress…";
  } else if (saveStatus === "error") {
    text = <span className="text-rubric">Couldn&apos;t save your last answer — check your connection.</span>;
  } else {
    text = `${masteredCount} of ${FIDEL_LETTERS.length} letters mastered · ${dueCount} due for review${
      saveStatus === "saving" ? " · saving…" : saveStatus === "saved" ? " · saved" : ""
    }`;
  }
  return (
    <p className="mt-2 font-mono text-xs text-ink/60" aria-live="polite" data-testid="progress-note">
      {text}
    </p>
  );
}

function Choice({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-md border-2 px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-rubric bg-rubric text-parchment"
          : "border-border bg-card text-ink hover:border-gold"
      }`}
    >
      {children}
    </button>
  );
}
