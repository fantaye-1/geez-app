import Link from "next/link";
import type { Metadata } from "next";
import { VOCAB_THEMES, VOCABULARY, wordsByTheme } from "@/lib/vocabulary";

export const metadata: Metadata = {
  title: "Vocabulary (ቃል) · Learn Ge'ez",
  description: "Core Ge'ez words from scripture and everyday use, with transliteration and meaning.",
};

export default function VocabularyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="font-mono text-xs uppercase tracking-wide text-ink/60">
        <Link href="/" className="hover:text-rubric">
          Home
        </Link>{" "}
        / Vocabulary
      </p>
      <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
        Vocabulary <span className="font-ethiopic text-rubric">ቃል</span>
      </h1>
      <p className="mt-3 max-w-2xl text-ink/80">
        {VOCABULARY.length} core words to start with. Read each word aloud using the{" "}
        <Link href="/learn/script" className="text-rubric underline">
          Fidel chart
        </Link>
        , then check the transliteration and meaning. More words are added in small batches.
      </p>
      <Link
        href="/learn/vocabulary/practice"
        className="mt-5 inline-block rounded-md bg-rubric px-5 py-2.5 font-display text-parchment hover:bg-rubric/90"
      >
        Practice these words
      </Link>

      {VOCAB_THEMES.map((theme) => {
        const words = wordsByTheme(theme.id);
        const headingId = `theme-${theme.id}`;
        return (
          <section key={theme.id} className="mt-10" aria-labelledby={headingId}>
            <h2 id={headingId} className="font-display text-2xl text-ink">
              {theme.title}{" "}
              <span lang="gez" className="font-ethiopic text-xl text-rubric/80">
                {theme.ethiopic}
              </span>
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {words.map((word) => (
                <li
                  key={word.id}
                  className="rounded-lg border border-border bg-card p-4"
                  data-testid="vocab-word"
                >
                  <p lang="gez" className="break-words font-ethiopic text-3xl text-rubric">
                    {word.geez}
                  </p>
                  <p className="mt-2 font-mono text-sm text-ink/70">{word.translit}</p>
                  <p className="mt-1 text-ink">{word.meaning}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
