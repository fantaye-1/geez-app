// The classical Ge'ez Fidel (syllabary): 26 consonant families, each
// written in 7 vowel "orders". Letters are generated from the Unicode
// Ethiopic block, where every family occupies 8 consecutive code points
// and orders 1–7 are the first 7 of them — so no character is hand-typed.
//
// Amharic-only letters (ሸ ቸ ኘ ጀ …) are intentionally left out.

export type VowelOrder = {
  /** 1–7 */
  order: number;
  /** Traditional Ge'ez name of the order */
  name: string;
  /** Vowel in scholarly transliteration */
  vowel: string;
};

export type FidelFamily = {
  /** Stable id used in progress records, e.g. "hoy" */
  id: string;
  /** Traditional letter name */
  name: string;
  /** Consonant in scholarly transliteration */
  consonant: string;
  /** Unicode code point of the 1st-order form */
  base: number;
};

export type FidelLetter = {
  /** Progress-table content_id, e.g. "hoy-4" */
  id: string;
  char: string;
  family: FidelFamily;
  order: VowelOrder;
  /** Transliterated syllable, e.g. "ha" */
  sound: string;
};

export const VOWEL_ORDERS: VowelOrder[] = [
  { order: 1, name: "Gəʿəz", vowel: "ä" },
  { order: 2, name: "Kaʿəb", vowel: "u" },
  { order: 3, name: "Saləs", vowel: "i" },
  { order: 4, name: "Rabəʿ", vowel: "a" },
  { order: 5, name: "Haməs", vowel: "e" },
  { order: 6, name: "Sadəs", vowel: "ə" },
  { order: 7, name: "Sabəʿ", vowel: "o" },
];

/** The 26 families in traditional (abugida) order. */
export const FIDEL_FAMILIES: FidelFamily[] = [
  { id: "hoy", name: "Hoy", consonant: "h", base: 0x1200 }, // ሀ
  { id: "lawe", name: "Läwe", consonant: "l", base: 0x1208 }, // ለ
  { id: "hawt", name: "Ḥäwt", consonant: "ḥ", base: 0x1210 }, // ሐ
  { id: "may", name: "May", consonant: "m", base: 0x1218 }, // መ
  { id: "sawt", name: "Śawt", consonant: "ś", base: 0x1220 }, // ሠ
  { id: "res", name: "Rəʾs", consonant: "r", base: 0x1228 }, // ረ
  { id: "sat", name: "Sat", consonant: "s", base: 0x1230 }, // ሰ
  { id: "qaf", name: "Qaf", consonant: "q", base: 0x1240 }, // ቀ
  { id: "bet", name: "Bet", consonant: "b", base: 0x1260 }, // በ
  { id: "tawe", name: "Täwe", consonant: "t", base: 0x1270 }, // ተ
  { id: "harm", name: "Ḫärm", consonant: "ḫ", base: 0x1280 }, // ኀ
  { id: "nahas", name: "Nähas", consonant: "n", base: 0x1290 }, // ነ
  { id: "alf", name: "ʾÄlf", consonant: "ʾ", base: 0x12a0 }, // አ
  { id: "kaf", name: "Kaf", consonant: "k", base: 0x12a8 }, // ከ
  { id: "wawe", name: "Wäwe", consonant: "w", base: 0x12c8 }, // ወ
  { id: "ayn", name: "ʿÄyn", consonant: "ʿ", base: 0x12d0 }, // ዐ
  { id: "zay", name: "Zäy", consonant: "z", base: 0x12d8 }, // ዘ
  { id: "yaman", name: "Yämän", consonant: "y", base: 0x12e8 }, // የ
  { id: "dant", name: "Dänt", consonant: "d", base: 0x12f0 }, // ደ
  { id: "gaml", name: "Gäml", consonant: "g", base: 0x1308 }, // ገ
  { id: "tayt", name: "Ṭäyt", consonant: "ṭ", base: 0x1320 }, // ጠ
  { id: "payt", name: "P̣äyt", consonant: "p̣", base: 0x1330 }, // ጰ
  { id: "saday", name: "Ṣädäy", consonant: "ṣ", base: 0x1338 }, // ጸ
  { id: "dappa", name: "Ḍäppä", consonant: "ḍ", base: 0x1340 }, // ፀ
  { id: "af", name: "ʾÄf", consonant: "f", base: 0x1348 }, // ፈ
  { id: "psa", name: "Psa", consonant: "p", base: 0x1350 }, // ፐ
];

export function letterFor(family: FidelFamily, order: VowelOrder): FidelLetter {
  return {
    id: `${family.id}-${order.order}`,
    char: String.fromCodePoint(family.base + order.order - 1),
    family,
    order,
    sound: family.consonant + order.vowel,
  };
}

/** All 182 letters, row by row (family), then by vowel order. */
export const FIDEL_LETTERS: FidelLetter[] = FIDEL_FAMILIES.flatMap((family) =>
  VOWEL_ORDERS.map((order) => letterFor(family, order))
);
