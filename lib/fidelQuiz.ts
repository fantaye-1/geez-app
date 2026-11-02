// Question builder for the Fidel practice quiz.
// Pure functions (randomness is injectable) so the logic can be tested
// without a browser.

import {
  FIDEL_FAMILIES,
  VOWEL_ORDERS,
  letterFor,
  type FidelFamily,
  type FidelLetter,
} from "./fidel";

export type QuizDirection = "letter-to-sound" | "sound-to-letter";

export type LetterSet = {
  id: "beginner" | "half" | "all";
  label: string;
  /** How many families, counted from ሀ in traditional order */
  familyCount: number;
};

export const LETTER_SETS: LetterSet[] = [
  { id: "beginner", label: "ሀ – ሰ (7 families)", familyCount: 7 },
  { id: "half", label: "ሀ – ነ (12 families)", familyCount: 12 },
  { id: "all", label: "All 26 families", familyCount: 26 },
];

export const QUESTIONS_PER_ROUND = 10;
export const CHOICES_PER_QUESTION = 4;

export type QuizQuestion = {
  answer: FidelLetter;
  /** 4 letters including the answer, already shuffled */
  choices: FidelLetter[];
};

/**
 * Families learners commonly mix up — same sound in modern reading
 * (ሀ/ሐ/ኀ, ሰ/ሠ, አ/ዐ, ጸ/ፀ) or a similar shape (ረ/ፈ, ነ/ከ, ተ/ጠ).
 */
const CONFUSABLE_GROUPS: string[][] = [
  ["hoy", "hawt", "harm"],
  ["sat", "sawt"],
  ["alf", "ayn"],
  ["saday", "dappa"],
  ["res", "af"],
  ["nahas", "kaf"],
  ["tawe", "tayt"],
];

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

export function familiesFor(set: LetterSet): FidelFamily[] {
  return FIDEL_FAMILIES.slice(0, set.familyCount);
}

/**
 * Wrong choices that make the learner read the vowel mark:
 * two other forms of the same family, plus the same form of a
 * confusable family (or any other family in the set).
 */
export function distractorsFor(
  answer: FidelLetter,
  families: FidelFamily[],
  rng: Rng = Math.random
): FidelLetter[] {
  const otherOrders = VOWEL_ORDERS.filter((o) => o.order !== answer.order.order);
  const sameFamily = shuffle(otherOrders, rng)
    .slice(0, 2)
    .map((o) => letterFor(answer.family, o));

  const inSet = (id: string) => families.some((f) => f.id === id);
  const group = CONFUSABLE_GROUPS.find((g) => g.includes(answer.family.id)) ?? [];
  const confusable = group.filter((id) => id !== answer.family.id && inSet(id));
  const otherFamilies = families.filter((f) => f.id !== answer.family.id);

  let family: FidelFamily;
  if (confusable.length > 0) {
    const id = pick(confusable, rng);
    family = families.find((f) => f.id === id)!;
  } else {
    family = pick(otherFamilies, rng);
  }

  return [...sameFamily, letterFor(family, answer.order)];
}

/** A round of distinct letters from the chosen set. */
export function buildRound(
  set: LetterSet,
  rng: Rng = Math.random,
  count: number = QUESTIONS_PER_ROUND
): QuizQuestion[] {
  const families = familiesFor(set);
  const pool = families.flatMap((f) => VOWEL_ORDERS.map((o) => letterFor(f, o)));
  return shuffle(pool, rng)
    .slice(0, count)
    .map((answer) => ({
      answer,
      choices: shuffle([answer, ...distractorsFor(answer, families, rng)], rng),
    }));
}
