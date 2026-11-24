import { test } from "node:test";
import assert from "node:assert/strict";

import { choiceIndexForKey } from "./answerKeys";

test("digits 1–4 pick the matching choice", () => {
  assert.equal(choiceIndexForKey({ key: "1" }, 4), 0);
  assert.equal(choiceIndexForKey({ key: "2" }, 4), 1);
  assert.equal(choiceIndexForKey({ key: "4" }, 4), 3);
});

test("digits past the last choice, 0 and other keys do nothing", () => {
  assert.equal(choiceIndexForKey({ key: "5" }, 4), null);
  assert.equal(choiceIndexForKey({ key: "0" }, 4), null);
  assert.equal(choiceIndexForKey({ key: "a" }, 4), null);
  assert.equal(choiceIndexForKey({ key: "Enter" }, 4), null);
  assert.equal(choiceIndexForKey({ key: "12" }, 4), null);
  assert.equal(choiceIndexForKey({ key: "1" }, 0), null);
});

test("modifier combos and held-down keys are ignored", () => {
  assert.equal(choiceIndexForKey({ key: "1", ctrlKey: true }, 4), null);
  assert.equal(choiceIndexForKey({ key: "1", metaKey: true }, 4), null);
  assert.equal(choiceIndexForKey({ key: "1", altKey: true }, 4), null);
  assert.equal(choiceIndexForKey({ key: "1", repeat: true }, 4), null);
});
