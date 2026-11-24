import { test } from "node:test";
import assert from "node:assert/strict";

import type { Rng } from "./fidelQuiz";
import { VOCABULARY, type VocabWord } from "./vocabulary";
import {
  VOCAB_CHOICES_PER_QUESTION,
  VOCAB_QUESTIONS_PER_ROUND,
  buildVocabRound,
  vocabDistractors,
} from "./vocabQuiz";

/** Small seeded PRNG (mulberry32) so failures are reproducible. */
function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

test("a round asks each word at most once", () => {
  for (const seed of SEEDS) {
    const round = buildVocabRound(VOCABULARY, seeded(seed));
    assert.equal(round.length, Math.min(VOCAB_QUESTIONS_PER_ROUND, VOCABULARY.length));
    const ids = round.map((q) => q.answer.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test("every question has 4 distinct choices including the answer", () => {
  for (const seed of SEEDS) {
    for (const q of buildVocabRound(VOCABULARY, seeded(seed))) {
      assert.equal(q.choices.length, VOCAB_CHOICES_PER_QUESTION);
      const ids = q.choices.map((c) => c.id);
      assert.equal(new Set(ids).size, ids.length, `duplicate choice for ${q.answer.id}`);
      assert.ok(ids.includes(q.answer.id), `answer missing for ${q.answer.id}`);
    }
  }
});

test("choices have distinct meanings and spellings, so only one is right", () => {
  for (const seed of SEEDS) {
    for (const q of buildVocabRound(VOCABULARY, seeded(seed))) {
      const meanings = q.choices.map((c) => c.meaning);
      const spellings = q.choices.map((c) => c.geez);
      assert.equal(new Set(meanings).size, meanings.length);
      assert.equal(new Set(spellings).size, spellings.length);
    }
  }
});

test("distractors prefer words from the same theme", () => {
  for (const seed of SEEDS) {
    for (const answer of VOCABULARY) {
      const sameThemeCount = VOCABULARY.filter(
        (w) => w.theme === answer.theme && w.id !== answer.id
      ).length;
      const wrong = vocabDistractors(answer, VOCABULARY, seeded(seed));
      const expectedSame = Math.min(sameThemeCount, VOCAB_CHOICES_PER_QUESTION - 1);
      const actualSame = wrong.filter((w) => w.theme === answer.theme).length;
      assert.equal(actualSame, expectedSame, answer.id);
      assert.ok(!wrong.some((w) => w.id === answer.id));
    }
  }
});

test("small word lists give a shorter round and fewer choices", () => {
  const few: VocabWord[] = VOCABULARY.slice(0, 3);
  const round = buildVocabRound(few, seeded(1));
  assert.equal(round.length, 3);
  for (const q of round) assert.equal(q.choices.length, 3);
  assert.deepEqual(buildVocabRound([], seeded(1)), []);
});

test("a round can be shorter than the default", () => {
  assert.equal(buildVocabRound(VOCABULARY, seeded(7), 4).length, 4);
});
