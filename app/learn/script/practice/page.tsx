"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FidelLetter } from "@/lib/fidel";
import {
  LETTER_SETS,
  buildRound,
  type LetterSet,
  type QuizDirection,
  type QuizQuestion,
} from "@/lib/fidelQuiz";

const CORRECT_DELAY_MS = 700;
const WRONG_DELAY_MS = 1600;

type Phase = "setup" | "playing" | "done";

export default function FidelPracticePage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [letterSet, setLetterSet] = useState<LetterSet>(LETTER_SETS[0]);
  const [direction, setDirection] = useState<QuizDirection>("letter-to-sound");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<FidelLetter | null>(null);
  const [missed, setMissed] = useState<FidelLetter[]>([]);

  const question = questions[index];

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
    setQuestions(buildRound(letterSet));
    setIndex(0);
    setPicked(null);
    setMissed([]);
    setPhase("playing");
  }

  function answer(choice: FidelLetter) {
    if (picked || !question) return;
    setPicked(choice);
    if (choice.id !== question.answer.id) {
      setMissed((m) => [...m, question.answer]);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <Link
        href="/learn/script"
        className="font-mono text-xs text-ink/60 hover:text-rubric"
      >
        ← Fidel chart
      </Link>
      <h1 className="mt-4 font-display text-3xl text-ink">Fidel practice</h1>

      {phase === "setup" && (
        <section className="mt-6 space-y-6">
          <fieldset>
            <legend className="font-mono text-xs uppercase tracking-wide text-ink/60">
              Letters
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {LETTER_SETS.map((s) => (
                <Choice
                  key={s.id}
                  active={letterSet.id === s.id}
                  onClick={() => setLetterSet(s)}
                >
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
            Start — 10 questions
          </button>
        </section>
      )}

      {phase === "playing" && question && (
        <section className="mt-6">
          <div className="flex items-center justify-between font-mono text-xs text-ink/60">
            <span>
              Question {index + 1} of {questions.length}
            </span>
            <span>
              {index + (picked ? 1 : 0) - missed.length} correct
            </span>
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
              className="rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90"
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

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border-2 px-4 py-2 text-sm transition-colors ${
        active
          ? "border-rubric bg-rubric text-parchment"
          : "border-border bg-card text-ink hover:border-gold"
      }`}
    >
      {children}
    </button>
  );
}
