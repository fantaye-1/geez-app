"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import LetterRecorder from "@/components/LetterRecorder";
import { canManageAudio, fetchLetterAudio, type AudioMap } from "@/lib/letterAudio";
import {
  FIDEL_FAMILIES,
  FIDEL_LETTERS,
  VOWEL_ORDERS,
  letterFor,
  type FidelLetter,
} from "@/lib/fidel";
import { moveInGrid } from "@/lib/gridNav";
import { fetchScriptProgress, type ProgressMap } from "@/lib/progress";
import { isDue, localDate, type SrsState } from "@/lib/srs";
import { useUser } from "@/lib/useUser";

function formatDue(state: SrsState): string {
  if (isDue(state, localDate())) return "due today";
  const [y, m, d] = state.dueDate.split("-").map(Number);
  return `next review ${new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

export default function FidelChartPage() {
  const [selected, setSelected] = useState<FidelLetter>(() =>
    letterFor(FIDEL_FAMILIES[0], VOWEL_ORDERS[0])
  );

  // Signed-in learners see which letters they've practiced and mastered.
  const { user } = useUser();
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  useEffect(() => {
    setProgress(null);
    if (!user) return;
    let active = true;
    fetchScriptProgress(user.id)
      .then((map) => active && setProgress(map))
      .catch(() => {}); // the chart works fine without marks
    return () => {
      active = false;
    };
  }, [user]);
  const selectedState = progress?.get(selected.id);

  // Recordings: everyone can listen; the owner and audio admins can record.
  const [audio, setAudio] = useState<AudioMap>(() => new Map());
  const [canRecord, setCanRecord] = useState(false);
  const player = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    let active = true;
    fetchLetterAudio().then((map) => active && setAudio(map));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setCanRecord(false);
    if (!user) return;
    let active = true;
    canManageAudio(user.id).then((ok) => active && setCanRecord(ok));
    return () => {
      active = false;
    };
  }, [user]);
  const selectedAudio = audio.get(selected.id);

  function play(url: string) {
    player.current?.pause();
    const el = new Audio(url);
    player.current = el;
    el.play().catch(() => {}); // e.g. a format this browser can't decode
  }

  // Keyboard: only the selected letter is a Tab stop; arrow keys (plus
  // Home/End, Ctrl+Home/End, PageUp/PageDown) move the selection.
  const cells = useRef(new Map<string, HTMLButtonElement>());
  function onChartKeyDown(e: KeyboardEvent) {
    const next = moveInGrid(
      {
        row: FIDEL_FAMILIES.indexOf(selected.family),
        col: VOWEL_ORDERS.indexOf(selected.order),
      },
      e.key,
      FIDEL_FAMILIES.length,
      VOWEL_ORDERS.length,
      { ctrl: e.ctrlKey || e.metaKey }
    );
    if (!next) return;
    e.preventDefault(); // don't scroll the page
    const letter = letterFor(FIDEL_FAMILIES[next.row], VOWEL_ORDERS[next.col]);
    setSelected(letter);
    cells.current.get(letter.id)?.focus();
  }

  // /learn/script?letter=hoy-4 opens with that letter selected
  // (used by "Letters to review" on the practice page).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("letter");
    const letter = FIDEL_LETTERS.find((l) => l.id === id);
    if (letter) setSelected(letter);
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/" className="font-mono text-xs text-ink/60 hover:text-rubric">
        ← Home
      </Link>

      <header className="mt-4 mb-6">
        <h1 className="font-display text-3xl text-ink">The Fidel</h1>
        <p className="mt-2 max-w-2xl text-ink/80">
          Ge&apos;ez is written with 26 consonant families. Each family has
          seven forms — one for each vowel. Read across a row to hear the
          vowels change; read down a column to meet each consonant. Tap any
          letter to see its sound.
        </p>
        <Link
          href="/learn/script/practice"
          className="mt-4 inline-block rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90"
        >
          Practice →
        </Link>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Chart */}
        <div className="overflow-x-auto rounded-lg border border-border bg-card lg:flex-1">
          <table
            className="w-full border-collapse text-center"
            aria-label="Fidel chart"
            aria-describedby="fidel-keys"
            onKeyDown={onChartKeyDown}
          >
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="sticky left-0 bg-card px-2 py-2 text-left font-mono text-xs font-medium text-ink/60 sm:px-3"
                >
                  Family
                </th>
                {VOWEL_ORDERS.map((o) => (
                  <th
                    key={o.order}
                    scope="col"
                    className="px-1 py-2 font-mono text-xs font-medium text-ink/60"
                    title={`${o.order}. ${o.name}`}
                  >
                    {o.vowel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIDEL_FAMILIES.map((family) => (
                <tr key={family.id} className="border-b border-border/50 last:border-0">
                  <th
                    scope="row"
                    className="sticky left-0 bg-card px-2 py-1 text-left font-mono text-xs font-normal text-ink/70 sm:px-3"
                  >
                    {family.name}
                  </th>
                  {VOWEL_ORDERS.map((order) => {
                    const letter = letterFor(family, order);
                    const isSelected = letter.id === selected.id;
                    const status = progress?.get(letter.id)?.status;
                    return (
                      <td key={letter.id} className="p-0 sm:p-0.5">
                        <button
                          type="button"
                          ref={(el) => {
                            if (el) cells.current.set(letter.id, el);
                            else cells.current.delete(letter.id);
                          }}
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() => setSelected(letter)}
                          aria-label={`${letter.char}, ${letter.sound}${
                            status ? `, ${status}` : ""
                          }`}
                          aria-pressed={isSelected}
                          data-status={status}
                          className={`relative h-10 w-10 rounded font-ethiopic text-xl transition-colors sm:h-11 sm:w-11 sm:text-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                            isSelected
                              ? "bg-rubric text-parchment"
                              : "text-ink hover:bg-parchment"
                          }`}
                        >
                          {letter.char}
                          {status && (
                            <span
                              aria-hidden
                              className={`absolute right-0.5 top-0.5 h-2 w-2 rounded-full ${
                                status === "mastered"
                                  ? "bg-gold"
                                  : "border border-gold/70 bg-transparent"
                              }`}
                            />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel. On phones it sits above the chart and stays pinned
            to the top while scrolling, so tapping a letter in the lower rows
            still shows its sound; on wide screens it's the sidebar. */}
        <aside
          aria-live="polite"
          data-testid="letter-detail"
          className="sticky top-2 z-10 order-first rounded-lg border border-border bg-card p-4 shadow-md lg:order-none lg:top-6 lg:w-64 lg:p-6 lg:text-center lg:shadow-none"
        >
          <div className="flex items-center gap-4 lg:block">
            <div className="font-ethiopic text-6xl leading-none text-rubric lg:text-8xl">
              {selected.char}
            </div>
            <div className="min-w-0 lg:mt-4">
              <div className="font-display text-2xl text-ink lg:text-3xl">
                {selected.sound}
              </div>
              <div className="font-mono text-xs text-ink/60 lg:hidden">
                {selected.family.name} · form {selected.order.order}
              </div>
              {selectedAudio && (
                <button
                  type="button"
                  onClick={() => play(selectedAudio)}
                  className="mt-2 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-ink hover:border-gold lg:mt-3"
                  aria-label={`Hear ${selected.char}`}
                >
                  <span aria-hidden>🔊</span> Hear it
                </button>
              )}
            </div>
          </div>
          <dl className="mt-4 hidden space-y-1 text-sm text-ink/80 lg:block">
            <div>
              <dt className="inline text-ink/60">Family: </dt>
              <dd className="inline">{selected.family.name}</dd>
            </div>
            <div>
              <dt className="inline text-ink/60">Form: </dt>
              <dd className="inline">
                {selected.order.order} — {selected.order.name}
              </dd>
            </div>
          </dl>
          <p className="mt-4 hidden font-ethiopic text-2xl tracking-widest text-ink/70 lg:block">
            {VOWEL_ORDERS.map((o) => letterFor(selected.family, o).char).join(" ")}
          </p>
          {progress && (
            <p className="mt-2 font-mono text-xs text-ink/70 lg:mt-4" data-testid="letter-status">
              {!selectedState
                ? "Not practiced yet"
                : selectedState.status === "mastered"
                ? `Mastered · ${formatDue(selectedState)}`
                : `Learning · ${formatDue(selectedState)}`}
            </p>
          )}
          {canRecord && (
            <LetterRecorder
              letterId={selected.id}
              label={`${selected.char} (${selected.sound})`}
              hasRecording={!!selectedAudio}
              onSaved={(url) => {
                setAudio((m) => new Map(m).set(selected.id, url));
                play(url);
              }}
            />
          )}
        </aside>
      </div>

      {progress && (
        <p className="mt-4 flex flex-wrap items-center gap-4 font-mono text-xs text-ink/60">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gold" /> Mastered (
            {[...progress.values()].filter((s) => s.status === "mastered").length})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-gold/70" /> Learning (
            {[...progress.values()].filter((s) => s.status === "learning").length})
          </span>
        </p>
      )}
      {canRecord && (
        <p className="mt-2 font-mono text-xs text-ink/60" data-testid="recorded-count">
          🎙 {FIDEL_LETTERS.filter((l) => audio.has(l.id)).length} of {FIDEL_LETTERS.length}{" "}
          letters recorded
        </p>
      )}

      <p id="fidel-keys" className="mt-6 font-mono text-xs text-ink/50">
        Keyboard: Tab into the chart, then use the arrow keys to move between
        letters (Home/End for the row, Page Up/Down to jump five rows).
      </p>
      <p className="mt-2 font-mono text-xs text-ink/50">
        Sounds use standard Ge&apos;ez transliteration: ä as in &quot;cut&quot;,
        ə is a short neutral vowel, and a dot under a letter (ḥ, ṭ, ṣ…) marks
        an emphatic consonant.
      </p>
    </main>
  );
}
