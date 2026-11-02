"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FIDEL_FAMILIES,
  VOWEL_ORDERS,
  letterFor,
  type FidelLetter,
} from "@/lib/fidel";

export default function FidelChartPage() {
  const [selected, setSelected] = useState<FidelLetter>(() =>
    letterFor(FIDEL_FAMILIES[0], VOWEL_ORDERS[0])
  );

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
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Chart */}
        <div className="overflow-x-auto rounded-lg border border-border bg-card lg:flex-1">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="sticky left-0 bg-card px-3 py-2 text-left font-mono text-xs font-medium text-ink/60"
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
                    className="sticky left-0 bg-card px-3 py-1 text-left font-mono text-xs font-normal text-ink/70"
                  >
                    {family.name}
                  </th>
                  {VOWEL_ORDERS.map((order) => {
                    const letter = letterFor(family, order);
                    const isSelected = letter.id === selected.id;
                    return (
                      <td key={letter.id} className="p-0.5">
                        <button
                          type="button"
                          onClick={() => setSelected(letter)}
                          aria-label={`${letter.char}, ${letter.sound}`}
                          aria-pressed={isSelected}
                          className={`h-11 w-11 rounded font-ethiopic text-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                            isSelected
                              ? "bg-rubric text-parchment"
                              : "text-ink hover:bg-parchment"
                          }`}
                        >
                          {letter.char}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        <aside
          aria-live="polite"
          className="rounded-lg border border-border bg-card p-6 text-center lg:sticky lg:top-6 lg:w-64"
        >
          <div className="font-ethiopic text-8xl leading-none text-rubric">
            {selected.char}
          </div>
          <div className="mt-4 font-display text-3xl text-ink">{selected.sound}</div>
          <dl className="mt-4 space-y-1 text-sm text-ink/80">
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
          <p className="mt-4 font-ethiopic text-2xl tracking-widest text-ink/70">
            {VOWEL_ORDERS.map((o) => letterFor(selected.family, o).char).join(" ")}
          </p>
        </aside>
      </div>

      <p className="mt-6 font-mono text-xs text-ink/50">
        Sounds use standard Ge&apos;ez transliteration: ä as in &quot;cut&quot;,
        ə is a short neutral vowel, and a dot under a letter (ḥ, ṭ, ṣ…) marks
        an emphatic consonant.
      </p>
    </main>
  );
}
