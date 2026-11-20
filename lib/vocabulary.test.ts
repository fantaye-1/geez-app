import { test } from "node:test";
import assert from "node:assert/strict";

import { FIDEL_LETTERS } from "./fidel";
import { VOCAB_THEMES, VOCABULARY, wordsByTheme } from "./vocabulary";

test("vocabulary ids are unique and prefixed", () => {
  const ids = VOCABULARY.map((w) => w.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^vocab-[a-z]+$/);
});

test("every word is written only with classical Ge'ez letters", () => {
  const geezLetters = new Set(FIDEL_LETTERS.map((l) => l.char));
  for (const word of VOCABULARY) {
    for (const ch of word.geez) {
      assert.ok(geezLetters.has(ch), `${word.id}: "${ch}" is not in the Ge'ez Fidel`);
    }
  }
});

test("every word has a transliteration and a meaning", () => {
  for (const word of VOCABULARY) {
    assert.ok(word.translit.trim(), `${word.id} has no transliteration`);
    assert.ok(word.meaning.trim(), `${word.id} has no meaning`);
  }
});

test("every word belongs to a listed theme, and every theme has words", () => {
  const themeIds = new Set(VOCAB_THEMES.map((t) => t.id));
  for (const word of VOCABULARY) assert.ok(themeIds.has(word.theme), word.id);
  for (const theme of VOCAB_THEMES) assert.ok(wordsByTheme(theme.id).length > 0, theme.id);
  const total = VOCAB_THEMES.reduce((n, t) => n + wordsByTheme(t.id).length, 0);
  assert.equal(total, VOCABULARY.length);
});
