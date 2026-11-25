import { test } from "node:test";
import assert from "node:assert/strict";

import { progressUpsert, rowsToProgress } from "./progressRows";

test("rowsToProgress maps rows by content id", () => {
  const map = rowsToProgress([
    { content_id: "vocab-qal", status: "learning", srs_ease: 2.3, srs_interval_days: 1, srs_due_date: "2026-11-26" },
    { content_id: "vocab-bet", status: "mastered", srs_ease: 2.8, srs_interval_days: 9, srs_due_date: "2026-12-04" },
  ]);
  assert.equal(map.size, 2);
  assert.deepEqual(map.get("vocab-qal"), { status: "learning", ease: 2.3, intervalDays: 1, dueDate: "2026-11-26" });
  assert.equal(map.get("vocab-bet")?.status, "mastered");
});

test("rowsToProgress reads numeric strings and fills missing values", () => {
  const map = rowsToProgress([
    { content_id: "hoy-1", status: "learning", srs_ease: "2.10", srs_interval_days: null, srs_due_date: "2026-11-25" },
    { content_id: "hoy-2", status: "learning", srs_ease: null, srs_interval_days: 3, srs_due_date: "2026-11-27" },
  ]);
  assert.equal(map.get("hoy-1")?.ease, 2.1);
  assert.equal(map.get("hoy-1")?.intervalDays, 1);
  assert.equal(map.get("hoy-2")?.ease, 2.5);
});

test("rowsToProgress treats unknown statuses as learning", () => {
  const map = rowsToProgress([
    { content_id: "a", status: "weird", srs_ease: 2.5, srs_interval_days: 1, srs_due_date: "2026-11-25" },
  ]);
  assert.equal(map.get("a")?.status, "learning");
});

test("progressUpsert builds a row for the given content type", () => {
  const now = new Date("2026-11-25T17:40:00Z");
  const row = progressUpsert(
    "user-1",
    "vocabulary",
    "vocab-qal",
    { status: "learning", ease: 2.6, intervalDays: 3, dueDate: "2026-11-28" },
    now
  );
  assert.deepEqual(row, {
    user_id: "user-1",
    content_type: "vocabulary",
    content_id: "vocab-qal",
    status: "learning",
    srs_ease: 2.6,
    srs_interval_days: 3,
    srs_due_date: "2026-11-28",
    updated_at: "2026-11-25T17:40:00.000Z",
  });
});

test("progressUpsert round-trips through rowsToProgress", () => {
  const state = { status: "mastered" as const, ease: 2.8, intervalDays: 21, dueDate: "2026-12-16" };
  const map = rowsToProgress([progressUpsert("u", "script", "hoy-4", state)]);
  assert.deepEqual(map.get("hoy-4"), state);
});
