// Spaced repetition, a simplified SM-2 that fits the progress table's
// srs_ease / srs_interval_days / srs_due_date / status columns.
//
//   right answer on a letter that's due → wait longer before next review
//     (1 day → 3 days → interval × ease …), ease goes up a little
//   wrong answer → back to tomorrow, ease goes down
//   right answer on a letter that ISN'T due yet → nothing changes, so
//     replaying the quiz all afternoon can't fake "mastered"
//
// A letter counts as mastered once its interval reaches a week. From a
// first correct answer that takes three on-time correct reviews.

export type SrsStatus = "learning" | "mastered";

export type SrsState = {
  ease: number;
  intervalDays: number;
  /** YYYY-MM-DD, in the learner's local time */
  dueDate: string;
  status: SrsStatus;
};

export const START_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;
export const MAX_INTERVAL_DAYS = 180;
export const MASTERED_INTERVAL_DAYS = 7;

/** Today (or `d`) as YYYY-MM-DD in local time. */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return localDate(new Date(y, m - 1, d + days));
}

export function isDue(state: SrsState, today: string): boolean {
  return state.dueDate <= today; // YYYY-MM-DD strings sort as dates
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The next state after answering. `changed` is false when there's
 * nothing to save (a right answer on a letter that isn't due yet).
 */
export function nextReview(
  prev: SrsState | null,
  correct: boolean,
  today: string
): { state: SrsState; changed: boolean } {
  if (!correct) {
    const ease = round2(Math.max(MIN_EASE, (prev?.ease ?? START_EASE) - 0.2));
    return {
      state: { ease, intervalDays: 1, dueDate: addDays(today, 1), status: "learning" },
      changed: true,
    };
  }

  if (prev && !isDue(prev, today)) {
    return { state: prev, changed: false };
  }

  let intervalDays: number;
  if (!prev) intervalDays = 1;
  else if (prev.intervalDays <= 1) intervalDays = 3;
  else intervalDays = Math.round(prev.intervalDays * prev.ease);
  intervalDays = Math.min(MAX_INTERVAL_DAYS, intervalDays);

  const ease = prev ? round2(Math.min(MAX_EASE, prev.ease + 0.1)) : START_EASE;
  return {
    state: {
      ease,
      intervalDays,
      dueDate: addDays(today, intervalDays),
      status: intervalDays >= MASTERED_INTERVAL_DAYS ? "mastered" : "learning",
    },
    changed: true,
  };
}
