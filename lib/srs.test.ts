import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_EASE,
  MAX_INTERVAL_DAYS,
  MIN_EASE,
  START_EASE,
  addDays,
  isDue,
  localDate,
  nextReview,
  type SrsState,
} from "./srs";

const TODAY = "2026-03-10";

function state(overrides: Partial<SrsState> = {}): SrsState {
  return { ease: START_EASE, intervalDays: 1, dueDate: TODAY, status: "learning", ...overrides };
}

test("localDate formats as zero-padded YYYY-MM-DD in local time", () => {
  assert.equal(localDate(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(localDate(new Date(2026, 11, 31, 23, 59)), "2026-12-31");
});

test("addDays rolls over months, years and leap days", () => {
  assert.equal(addDays("2026-03-10", 1), "2026-03-11");
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(addDays("2026-03-10", 0), "2026-03-10");
});

test("isDue is true on and after the due date only", () => {
  assert.equal(isDue(state({ dueDate: "2026-03-09" }), TODAY), true);
  assert.equal(isDue(state({ dueDate: TODAY }), TODAY), true);
  assert.equal(isDue(state({ dueDate: "2026-03-11" }), TODAY), false);
});

test("first correct answer schedules the letter for tomorrow", () => {
  const { state: s, changed } = nextReview(null, true, TODAY);
  assert.equal(changed, true);
  assert.deepEqual(s, { ease: START_EASE, intervalDays: 1, dueDate: "2026-03-11", status: "learning" });
});

test("first wrong answer schedules tomorrow with lower ease", () => {
  const { state: s, changed } = nextReview(null, false, TODAY);
  assert.equal(changed, true);
  assert.deepEqual(s, { ease: 2.3, intervalDays: 1, dueDate: "2026-03-11", status: "learning" });
});

test("correct review on a 1-day interval moves to 3 days and raises ease", () => {
  const { state: s } = nextReview(state(), true, TODAY);
  assert.equal(s.intervalDays, 3);
  assert.equal(s.ease, 2.6);
  assert.equal(s.dueDate, "2026-03-13");
  assert.equal(s.status, "learning");
});

test("longer intervals grow by the ease factor", () => {
  const { state: s } = nextReview(state({ intervalDays: 8, ease: 2.7 }), true, TODAY);
  assert.equal(s.intervalDays, Math.round(8 * 2.7)); // 22
  assert.equal(s.dueDate, addDays(TODAY, 22));
});

test("three on-time correct answers master a new letter (1 → 3 → 8 days)", () => {
  let day = TODAY;
  let s: SrsState | null = null;
  const intervals: number[] = [];
  for (let i = 0; i < 3; i++) {
    s = nextReview(s, true, day).state;
    intervals.push(s.intervalDays);
    day = s.dueDate;
  }
  assert.deepEqual(intervals, [1, 3, 8]);
  assert.equal(s!.status, "mastered");
});

test("correct answer on a letter that isn't due changes nothing", () => {
  const prev = state({ intervalDays: 3, dueDate: "2026-03-12" });
  const result = nextReview(prev, true, TODAY);
  assert.equal(result.changed, false);
  assert.equal(result.state, prev);
});

test("wrong answer is always saved, even before the due date", () => {
  const prev = state({ intervalDays: 3, dueDate: "2026-03-12" });
  const { state: s, changed } = nextReview(prev, false, TODAY);
  assert.equal(changed, true);
  assert.equal(s.intervalDays, 1);
  assert.equal(s.dueDate, "2026-03-11");
});

test("wrong answer on a mastered letter sends it back to learning", () => {
  const prev = state({ intervalDays: 30, ease: 2.6, status: "mastered", dueDate: TODAY });
  const { state: s } = nextReview(prev, false, TODAY);
  assert.deepEqual(s, { ease: 2.4, intervalDays: 1, dueDate: "2026-03-11", status: "learning" });
});

test("ease never drops below MIN_EASE", () => {
  const { state: s } = nextReview(state({ ease: MIN_EASE + 0.1 }), false, TODAY);
  assert.equal(s.ease, MIN_EASE);
  assert.equal(nextReview(s, false, TODAY).state.ease, MIN_EASE);
});

test("ease never rises above MAX_EASE", () => {
  const { state: s } = nextReview(state({ ease: MAX_EASE, intervalDays: 3 }), true, TODAY);
  assert.equal(s.ease, MAX_EASE);
});

test("interval is capped at MAX_INTERVAL_DAYS", () => {
  const { state: s } = nextReview(state({ ease: MAX_EASE, intervalDays: 150 }), true, TODAY);
  assert.equal(s.intervalDays, MAX_INTERVAL_DAYS);
  assert.equal(s.dueDate, addDays(TODAY, MAX_INTERVAL_DAYS));
  assert.equal(s.status, "mastered");
});

test("ease is rounded to two decimals (no float drift)", () => {
  let s: SrsState = state({ ease: 1.7 });
  for (let i = 0; i < 5; i++) s = nextReview({ ...s, dueDate: TODAY }, true, TODAY).state;
  assert.equal(s.ease, 2.2);
});
