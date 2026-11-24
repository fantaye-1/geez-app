// Question builder for the vocabulary practice quiz.
// Pure functions (randomness is injectable) so the logic can be tested
// without a browser.

import { shuffle, type Rng } from "./fidelQuiz";
import { VOCABULARY, type VocabWord } from "./vocabulary";

export type VocabDirection = "word-to-meaning" | "meaning-to-word";

export const VOCAB_QUESTIONS_PER_ROUND = 10;
export const VOCAB_CHOICES_PER_QUESTION = 4;

export type VocabQuestion = {
  answer: VocabWord;
  /** Up to 4 words including the answer, already shuffled */
  choices: VocabWord[];
};

/**
 * Wrong choices for `answer`: words from the same theme first (they're
 * closer in meaning, so the learner has to read the word), then any others.
 */
export function vocabDistractors(
  answer: VocabWord,
  words: VocabWord[] = VOCABULARY,
  rng: Rng = Math.random,
  count: number = VOCAB_CHOICES_PER_QUESTION - 1
): VocabWord[] {
  const others = words.filter((w) => w.id !== answer.id);
  const sameTheme = shuffle(others.filter((w) => w.theme === answer.theme), rng);
  const otherTheme = shuffle(others.filter((w) => w.theme !== answer.theme), rng);
  return [...sameTheme, ...otherTheme].slice(0, count);
}

/** A round of up to `count` distinct words, each with shuffled choices. */
export function buildVocabRound(
  words: VocabWord[] = VOCABULARY,
  rng: Rng = Math.random,
  count: number = VOCAB_QUESTIONS_PER_ROUND
): VocabQuestion[] {
  return shuffle(words, rng)
    .slice(0, count)
    .map((answer) => ({
      answer,
      choices: shuffle([answer, ...vocabDistractors(answer, words, rng)], rng),
    }));
}
