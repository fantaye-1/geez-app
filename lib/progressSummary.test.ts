import { test } from "node:test";
import assert from "node:assert/strict";
import { FIDEL_LETTERS } from "./fidel";
import { summarizeProgress } from "./progressSummary";
import type { SrsState } from "./srs";

const TODAY = "2026-11-20";
const state = (dueDate: string, status: SrsState["status"] = "learning"): SrsState => ({
  ease: 2.5,
  intervalDays: 1,
  dueDate,
  status,
});

test("no progress: everything not started, nothing due", () => {
  const s = summarizeProgress(FIDEL_LETTERS, new Map(), TODAY);
  assert.equal(s.total, 182);
  assert.equal(s.notStarted, 182);
  assert.equal(s.learning + s.mastered + s.dueToday + s.dueThisWeek, 0);
  assert.equal(s.percentMastered, 0);
  assert.equal(s.families.length, 26);
  assert.ok(s.families.every((f) => f.total === 7 && f.seen === 0));
  assert.equal(s.families[0].family.id, "hoy"); // keeps traditional order
});

test("counts learning, mastered and due buckets", () => {
  const p = new Map<string, SrsState>([
    ["hoy-1", state("2026-11-19")], // overdue → due today
    ["hoy-2", state(TODAY)], // due today
    ["hoy-3", state("2026-11-27", "mastered")], // day 7 → this week
    ["lawe-1", state("2026-11-28", "mastered")], // day 8 → later
    ["lawe-2", state("2026-11-21")], // tomorrow → this week
  ]);
  const s = summarizeProgress(FIDEL_LETTERS, p, TODAY);
  assert.equal(s.learning, 3);
  assert.equal(s.mastered, 2);
  assert.equal(s.notStarted, 177);
  assert.equal(s.dueToday, 2);
  assert.equal(s.dueThisWeek, 2);
  assert.equal(s.percentMastered, 1); // 2/182 = 1.09 %
  const hoy = s.families.find((f) => f.family.id === "hoy")!;
  assert.deepEqual([hoy.seen, hoy.mastered, hoy.due], [3, 1, 2]);
  const lawe = s.families.find((f) => f.family.id === "lawe")!;
  assert.deepEqual([lawe.seen, lawe.mastered, lawe.due], [2, 1, 0]);
});

test("week window crosses month and year ends", () => {
  const p = new Map([
    ["hoy-1", state("2027-01-04")], // day 7
    ["hoy-2", state("2027-01-05")], // day 8
  ]);
  const s = summarizeProgress(FIDEL_LETTERS, p, "2026-12-28");
  assert.equal(s.dueThisWeek, 1);
});

test("ignores progress rows for letters that aren't in the list", () => {
  const p = new Map([["shaw-1", state(TODAY)]]);
  const s = summarizeProgress(FIDEL_LETTERS, p, TODAY);
  assert.equal(s.notStarted, 182);
  assert.equal(s.dueToday, 0);
});

test("all mastered → 100 %", () => {
  const p = new Map(FIDEL_LETTERS.map((l) => [l.id, state("2027-06-01", "mastered")]));
  const s = summarizeProgress(FIDEL_LETTERS, p, TODAY);
  assert.equal(s.percentMastered, 100);
  assert.equal(s.notStarted, 0);
});
