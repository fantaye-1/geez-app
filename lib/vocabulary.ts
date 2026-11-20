// Vocabulary (ቃል): core Ge'ez words, added in small, checked batches.
//
// Transliteration follows the same scheme as the Fidel chart (lib/fidel.ts):
// ä for the 1st order, ə for the 6th, ḥ / ś / ʾ for the distinct letters.
// Gemination isn't written in the script, so it's shown in the
// transliteration only where it's standard (ləbb).
//
// Only add a word when you're sure of its spelling and meaning in Ge'ez
// (not only in Amharic). Ids are stable: they become progress content ids.

export type VocabTheme = "scripture" | "everyday";

export type VocabWord = {
  /** Stable id, used as the progress-table content_id, e.g. "vocab-qal" */
  id: string;
  /** The word in Fidel */
  geez: string;
  /** Transliteration */
  translit: string;
  /** English meaning(s), most common first */
  meaning: string;
  theme: VocabTheme;
};

export const VOCAB_THEMES: { id: VocabTheme; title: string; ethiopic: string }[] = [
  { id: "scripture", title: "Creation and scripture", ethiopic: "ሰማይ ወምድር" },
  { id: "everyday", title: "Everyday words", ethiopic: "ቤት" },
];

/** Batch 1: ten very common words (the first five open Genesis 1). */
export const VOCABULARY: VocabWord[] = [
  { id: "vocab-egziabeher", geez: "እግዚአብሔር", translit: "ʾƎgziʾabəḥer", meaning: "God, the Lord", theme: "scripture" },
  { id: "vocab-samay", geez: "ሰማይ", translit: "sämay", meaning: "heaven, sky", theme: "scripture" },
  { id: "vocab-medr", geez: "ምድር", translit: "mədr", meaning: "earth, land", theme: "scripture" },
  { id: "vocab-berhan", geez: "ብርሃን", translit: "bərhan", meaning: "light", theme: "scripture" },
  { id: "vocab-qal", geez: "ቃል", translit: "qal", meaning: "word, voice", theme: "scripture" },
  { id: "vocab-may", geez: "ማይ", translit: "may", meaning: "water", theme: "everyday" },
  { id: "vocab-bet", geez: "ቤት", translit: "bet", meaning: "house", theme: "everyday" },
  { id: "vocab-negus", geez: "ንጉሥ", translit: "nəguś", meaning: "king", theme: "everyday" },
  { id: "vocab-salam", geez: "ሰላም", translit: "sälam", meaning: "peace", theme: "everyday" },
  { id: "vocab-lebb", geez: "ልብ", translit: "ləbb", meaning: "heart", theme: "everyday" },
];

export function wordsByTheme(theme: VocabTheme, words: VocabWord[] = VOCABULARY): VocabWord[] {
  return words.filter((w) => w.theme === theme);
}
