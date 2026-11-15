import { test } from "node:test";
import assert from "node:assert/strict";

import { FIDEL_FAMILIES, FIDEL_LETTERS, VOWEL_ORDERS, letterFor } from "./fidel";

const family = (id: string) => FIDEL_FAMILIES.find((f) => f.id === id)!;
const order = (n: number) => VOWEL_ORDERS.find((o) => o.order === n)!;

test("26 families × 7 vowel orders = 182 letters", () => {
  assert.equal(FIDEL_FAMILIES.length, 26);
  assert.equal(VOWEL_ORDERS.length, 7);
  assert.equal(FIDEL_LETTERS.length, 182);
});

test("vowel orders are numbered 1–7 in sequence", () => {
  assert.deepEqual(
    VOWEL_ORDERS.map((o) => o.order),
    [1, 2, 3, 4, 5, 6, 7]
  );
});

test("family ids, names and base code points are unique", () => {
  for (const key of ["id", "name", "base"] as const) {
    const values = FIDEL_FAMILIES.map((f) => f[key]);
    assert.equal(new Set(values).size, values.length, `duplicate ${key}`);
  }
});

test("every base is the start of an 8-code-point row in the Ethiopic block", () => {
  for (const f of FIDEL_FAMILIES) {
    assert.ok(f.base >= 0x1200 && f.base <= 0x1378, `${f.id} outside Ethiopic block`);
    assert.equal(f.base % 8, 0, `${f.id} base not aligned to a row`);
  }
});

test("families are in ascending code-point order (traditional order matches Unicode here)", () => {
  for (let i = 1; i < FIDEL_FAMILIES.length; i++) {
    assert.ok(FIDEL_FAMILIES[i].base > FIDEL_FAMILIES[i - 1].base, FIDEL_FAMILIES[i].id);
  }
});

test("first and last letters of the chart", () => {
  assert.equal(FIDEL_LETTERS[0].char, "ሀ");
  assert.equal(FIDEL_LETTERS[0].id, "hoy-1");
  assert.equal(FIDEL_LETTERS[181].char, "ፖ");
  assert.equal(FIDEL_LETTERS[181].id, "psa-7");
});

test("letterFor builds char, id and sound from family + order", () => {
  const ha = letterFor(family("hoy"), order(4));
  assert.equal(ha.char, "ሃ");
  assert.equal(ha.id, "hoy-4");
  assert.equal(ha.sound, "ha");

  const lu = letterFor(family("lawe"), order(2));
  assert.equal(lu.char, "ሉ");
  assert.equal(lu.sound, "lu");

  const ge = letterFor(family("gaml"), order(1));
  assert.equal(ge.char, "ገ");
  assert.equal(ge.sound, "gä");
});

test("spot-check base characters against the comments in fidel.ts", () => {
  const expected: Record<string, string> = {
    hoy: "ሀ", lawe: "ለ", hawt: "ሐ", may: "መ", sawt: "ሠ", res: "ረ", sat: "ሰ",
    qaf: "ቀ", bet: "በ", tawe: "ተ", harm: "ኀ", nahas: "ነ", alf: "አ", kaf: "ከ",
    wawe: "ወ", ayn: "ዐ", zay: "ዘ", yaman: "የ", dant: "ደ", gaml: "ገ", tayt: "ጠ",
    payt: "ጰ", saday: "ጸ", dappa: "ፀ", af: "ፈ", psa: "ፐ",
  };
  for (const f of FIDEL_FAMILIES) {
    assert.equal(letterFor(f, order(1)).char, expected[f.id], f.id);
  }
});

test("all 182 ids and characters are unique", () => {
  assert.equal(new Set(FIDEL_LETTERS.map((l) => l.id)).size, 182);
  assert.equal(new Set(FIDEL_LETTERS.map((l) => l.char)).size, 182);
});
