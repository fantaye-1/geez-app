import { test } from "node:test";
import assert from "node:assert/strict";

import { moveInGrid } from "./gridNav";

const ROWS = 26;
const COLS = 7;
const move = (row: number, col: number, key: string, opts = {}) =>
  moveInGrid({ row, col }, key, ROWS, COLS, opts);

test("arrow keys move one cell", () => {
  assert.deepEqual(move(3, 3, "ArrowLeft"), { row: 3, col: 2 });
  assert.deepEqual(move(3, 3, "ArrowRight"), { row: 3, col: 4 });
  assert.deepEqual(move(3, 3, "ArrowUp"), { row: 2, col: 3 });
  assert.deepEqual(move(3, 3, "ArrowDown"), { row: 4, col: 3 });
});

test("arrow keys stop at the edges instead of wrapping", () => {
  assert.deepEqual(move(0, 0, "ArrowLeft"), { row: 0, col: 0 });
  assert.deepEqual(move(0, 0, "ArrowUp"), { row: 0, col: 0 });
  assert.deepEqual(move(25, 6, "ArrowRight"), { row: 25, col: 6 });
  assert.deepEqual(move(25, 6, "ArrowDown"), { row: 25, col: 6 });
});

test("Home/End go to the ends of the row", () => {
  assert.deepEqual(move(4, 3, "Home"), { row: 4, col: 0 });
  assert.deepEqual(move(4, 3, "End"), { row: 4, col: 6 });
});

test("Ctrl+Home/End go to the first and last letter", () => {
  assert.deepEqual(move(4, 3, "Home", { ctrl: true }), { row: 0, col: 0 });
  assert.deepEqual(move(4, 3, "End", { ctrl: true }), { row: 25, col: 6 });
});

test("PageUp/PageDown jump several rows and clamp", () => {
  assert.deepEqual(move(10, 2, "PageDown"), { row: 15, col: 2 });
  assert.deepEqual(move(10, 2, "PageUp"), { row: 5, col: 2 });
  assert.deepEqual(move(23, 2, "PageDown"), { row: 25, col: 2 });
  assert.deepEqual(move(2, 2, "PageUp", { pageSize: 10 }), { row: 0, col: 2 });
});

test("other keys are ignored", () => {
  assert.equal(move(3, 3, "Enter"), null);
  assert.equal(move(3, 3, "a"), null);
  assert.equal(move(3, 3, "Tab"), null);
});
