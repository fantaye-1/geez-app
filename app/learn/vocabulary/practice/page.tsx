"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VOCABULARY, type VocabWord } from "@/lib/vocabulary";
import {
  VOCAB_QUESTIONS_PER_ROUND,
  buildVocabRound,
  type VocabDirection,
  type VocabQuestion,
} from "@/lib/vocabQuiz";
import { fetchVocabProgress, saveWordProgress, type ProgressMap } from "@/lib/progress";
import { isDue, localDate, nextReview } from "@/lib/srs";
import { useUser } from "@/lib/useUser";

const CORRECT_DELAY_MS = 900;
const WRONG_DELAY_MS = 1800;

type Phase = "setup" | "playing" | "done";
type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function VocabularyPracticePage() {
  const { user } = useUser();
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const [phase, setPhase] = useState<Phase>("setup");
  const [direction, setDirection] = useState<VocabDirection>("word-to-meaning");
  const [questions, setQuestions] = useState<VocabQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<VocabWord | null>(null);
  const [missed, setMissed] = useState<VocabWord[]>([]);

  const question = questions[index];
  const roundSize = Math.min(VOCAB_QUESTIONS_PER_ROUND, VOCABULARY.length);

  // Load saved word progress whenever someone signs in (cleared on sign-out).
  useEffect(() => {
    setProgress(null);
    setLoadError(false);
    if (!user) return;
    let active = true;
    fetchVocabProgress(user.id)
      .then((map) => active && setProgress(map))
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [user]);

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
    setQuestions(buildVocabRound());
    setIndex(0);
    setPicked(null);
    setMissed([]);
    setSaveStatus("idle");
    setPhase("playing");
  }

  function answer(choice: VocabWord) {
    if (picked || !question) return;
    const correct = choice.id === question.answer.id;
    setPicked(choice);
    if (!correct) setMissed((m) => [...m, question.answer]);
    if (user && progress) record(user.id, question.answer, correct);
  }

  function record(userId: string, word: VocabWord, correct: boolean) {
    const { state, changed } = nextReview(progress?.get(word.id) ?? null, correct, localDate());
    if (!changed) return;
    setProgress((p) => new Map(p ?? []).set(word.id, state));
    setSaveStatus("saving");
    saveWordProgress(userId, word.id, state)
      .then(() => setSaveStatus((s) => (s === "error" ? s : "saved")))
      .catch(() => setSaveStatus("error"));
  }

  // Only count ids that are still in the word list.
  const today = localDate();
  let masteredCount = 0;
  let dueCount = 0;
  for (const w of VOCABULARY) {
    const s = progress?.get(w.id);
    if (!s) continue;
    if (s.status === "mastered") masteredCount++;
    if (isDue(s, today)) dueCount++;
  }

  const wordToMeaning = direction === "word-to-meaning";

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <Link
        href="/learn/vocabulary"
        className="font-mono text-xs text-ink/60 hover:text-rubric"
      >
        ← Vocabulary
      </Link>
      <h1 className="mt-4 font-display text-3xl text-ink">Vocabulary practice</h1>
      <ProgressNote
        signedIn={!!user}
        loaded={!!progress}
        loadError={loadError}
        saveStatus={saveStatus}
        masteredCount={masteredCount}
        dueCount={dueCount}
      />

      {phase === "setup" && (
        <section className="mt-6 space-y-6">
          <fieldset>
            <legend className="font-mono text-xs uppercase tracking-wide text-ink/60">
              Direction
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <Choice active={wordToMeaning} onClick={() => setDirection("word-to-meaning")}>
                <span lang="gez" className="font-ethiopic">ቃል</span> → meaning
              </Choice>
              <Choice active={!wordToMeaning} onClick={() => setDirection("meaning-to-word")}>
                meaning → <span lang="gez" className="font-ethiopic">ቃል</span>
              </Choice>
            </div>
          </fieldset>

          <button
            type="button"
            onClick={start}
            className="rounded-md bg-rubric px-6 py-3 font-display text-lg text-parchment hover:bg-rubric/90"
          >
            Start — {roundSize} questions
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

          <div className="mt-8 rounded-lg border border-border bg-card px-4 py-10 text-center">
            {wordToMeaning ? (
              <span lang="gez" className="break-words font-ethiopic text-6xl leading-tight text-ink">
                {question.answer.geez}
              </span>
            ) : (
              <span className="font-display text-4xl text-ink">{question.answer.meaning}</span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2" role="group" aria-label="Answers">
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
                  lang={wordToMeaning ? undefined : "gez"}
                  className={`break-words rounded-lg border-2 px-3 py-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${tone} ${
                    wordToMeaning ? "font-display text-xl" : "font-ethiopic text-3xl"
                  }`}
                >
                  {wordToMeaning ? choice.meaning : choice.geez}
                </button>
              );
            })}
          </div>

          <p className="mt-4 min-h-6 text-center text-sm" aria-live="polite">
            {picked &&
              (picked.id === question.answer.id ? (
                <span className="text-green-800">
                  Correct! <span lang="gez" className="font-ethiopic">{question.answer.geez}</span>{" "}
                  ({question.answer.translit}) — {question.answer.meaning}
                </span>
              ) : (
                <span className="text-rubric">
                  It&apos;s <span lang="gez" className="font-ethiopic">{question.answer.geez}</span>{" "}
                  ({question.answer.translit}) — {question.answer.meaning}
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
              : "Keep practicing — these words need another look."}
          </p>

          {missed.length > 0 && (
            <div className="mt-6">
              <p className="font-mono text-xs uppercase tracking-wide text-ink/60">
                Words to review
              </p>
              <ul className="mt-3 space-y-2 text-left">
                {missed.map((w) => (
                  <li
                    key={w.id}
                    className="flex flex-wrap items-baseline gap-x-3 rounded-md border border-border px-3 py-2"
                  >
                    <span lang="gez" className="font-ethiopic text-2xl text-rubric">
                      {w.geez}
                    </span>
                    <span className="font-mono text-xs text-ink/70">{w.translit}</span>
                    <span className="text-ink">{w.meaning}</span>
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
        {VOCABULARY.length} words ·{" "}
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
    text = `${masteredCount} of ${VOCABULARY.length} words mastered · ${dueCount} due for review${
      saveStatus === "saving" ? " · saving…" : saveStatus === "saved" ? " · saved" : ""
    }`;
  }
  return (
    <p className="mt-2 font-mono text-xs text-ink/60" aria-live="polite">
      {text}
    </p>
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
