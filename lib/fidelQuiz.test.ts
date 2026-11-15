import { test } from "node:test";
import assert from "node:assert/strict";

import { FIDEL_FAMILIES, VOWEL_ORDERS, letterFor, type FidelLetter } from "./fidel";
import {
  CHOICES_PER_QUESTION,
  LETTER_SETS,
  QUESTIONS_PER_ROUND,
  buildReviewRound,
  buildRound,
  distractorsFor,
  familiesFor,
  shuffle,
  type Rng,
} from "./fidelQuiz";

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
const set = (id: string) => LETTER_SETS.find((s) => s.id === id)!;
const family = (id: string) => FIDEL_FAMILIES.find((f) => f.id === id)!;
const letter = (familyId: string, n: number) =>
  letterFor(family(familyId), VOWEL_ORDERS[n - 1]);

test("shuffle keeps every item and doesn't mutate its input", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  const copy = [...input];
  for (const seed of SEEDS) {
    const out = shuffle(input, seeded(seed));
    assert.deepEqual([...out].sort((a, b) => a - b), copy);
  }
  assert.deepEqual(input, copy);
});

test("shuffle is deterministic for the same rng", () => {
  const input = ["a", "b", "c", "d", "e"];
  assert.deepEqual(shuffle(input, seeded(7)), shuffle(input, seeded(7)));
});

test("letter sets map to the first N families", () => {
  assert.deepEqual(
    LETTER_SETS.map((s) => familiesFor(s).length),
    [7, 12, 26]
  );
  assert.equal(familiesFor(set("beginner"))[0].id, "hoy");
  assert.equal(familiesFor(set("beginner"))[6].id, "sat");
});

function checkDistractors(answer: FidelLetter, distractors: FidelLetter[], allowedFamilies: string[]) {
  assert.equal(distractors.length, CHOICES_PER_QUESTION - 1);
  const ids = distractors.map((d) => d.id);
  assert.ok(!ids.includes(answer.id), "answer appears among distractors");
  assert.equal(new Set(ids).size, ids.length, "duplicate distractor");

  const [a, b, c] = distractors;
  for (const d of [a, b]) {
    assert.equal(d.family.id, answer.family.id, "first two should share the answer's family");
    assert.notEqual(d.order.order, answer.order.order);
  }
  assert.notEqual(c.family.id, answer.family.id, "third should be another family");
  assert.equal(c.order.order, answer.order.order, "third should share the vowel order");
  assert.ok(allowedFamilies.includes(c.family.id), `${c.family.id} is outside the letter set`);
}

test("distractors: two forms of the same family + same form of another family", () => {
  const families = familiesFor(set("all"));
  const ids = families.map((f) => f.id);
  for (const seed of SEEDS) {
    const rng = seeded(seed);
    for (const answer of [letter("hoy", 1), letter("bet", 4), letter("psa", 7)]) {
      checkDistractors(answer, distractorsFor(answer, families, rng), ids);
    }
  }
});

test("distractors prefer a confusable family when it's in the set", () => {
  const families = familiesFor(set("beginner")); // ሀ ለ ሐ መ ሠ ረ ሰ
  for (const seed of SEEDS) {
    const sat = distractorsFor(letter("sat", 3), families, seeded(seed));
    assert.equal(sat[2].family.id, "sawt"); // ሰ ↔ ሠ

    const hoy = distractorsFor(letter("hoy", 2), families, seeded(seed));
    assert.equal(hoy[2].family.id, "hawt"); // ሀ ↔ ሐ (ኀ isn't in this set)
  }
});

test("distractors fall back to any family in the set when the look-alike isn't in it", () => {
  const families = familiesFor(set("beginner")); // ፈ (look-alike of ረ) not included
  const ids = families.map((f) => f.id);
  for (const seed of SEEDS) {
    const answer = letter("res", 5);
    checkDistractors(answer, distractorsFor(answer, families, seeded(seed)), ids);
  }
});

test("a round has 10 distinct questions from the chosen set, each with 4 distinct choices", () => {
  for (const s of LETTER_SETS) {
    const allowed = familiesFor(s).map((f) => f.id);
    for (const seed of SEEDS) {
      const round = buildRound(s, seeded(seed));
      assert.equal(round.length, QUESTIONS_PER_ROUND);
      assert.equal(new Set(round.map((q) => q.answer.id)).size, QUESTIONS_PER_ROUND);
      for (const q of round) {
        assert.ok(allowed.includes(q.answer.family.id));
        assert.equal(q.choices.length, CHOICES_PER_QUESTION);
        assert.equal(new Set(q.choices.map((c) => c.id)).size, CHOICES_PER_QUESTION);
        assert.equal(q.choices.filter((c) => c.id === q.answer.id).length, 1);
        for (const c of q.choices) assert.ok(allowed.includes(c.family.id));
      }
    }
  }
});

test("round size can be overridden", () => {
  assert.equal(buildRound(set("all"), seeded(1), 3).length, 3);
});

test("the answer isn't always in the same position", () => {
  const positions = new Set<number>();
  for (const seed of SEEDS) {
    for (const q of buildRound(set("all"), seeded(seed))) {
      positions.add(q.choices.findIndex((c) => c.id === q.answer.id));
    }
  }
  assert.deepEqual([...positions].sort(), [0, 1, 2, 3]);
});

test("review round only asks the due letters, and fewer than 10 is fine", () => {
  const due = [letter("may", 1), letter("zay", 6), letter("af", 3)];
  for (const seed of SEEDS) {
    const round = buildReviewRound(due, seeded(seed));
    assert.equal(round.length, 3);
    assert.deepEqual(
      round.map((q) => q.answer.id).sort(),
      due.map((l) => l.id).sort()
    );
  }
  assert.deepEqual(buildReviewRound([], seeded(1)), []);
});

test("review round caps at 10 when many letters are due", () => {
  const due = familiesFor(set("all")).map((f) => letterFor(f, VOWEL_ORDERS[0]));
  assert.equal(buildReviewRound(due, seeded(3)).length, QUESTIONS_PER_ROUND);
});
