// Turns saved Fidel progress into the numbers shown on /progress.
// Pure functions, no Supabase, so they're easy to test.

import { addDays, type SrsState } from "./srs";
import type { FidelFamily, FidelLetter } from "./fidel";

export type FamilySummary = {
  family: FidelFamily;
  /** Letters in this family (always 7) */
  total: number;
  /** Letters answered at least once */
  seen: number;
  mastered: number;
  due: number;
};

export type ProgressSummary = {
  total: number;
  /** Never answered */
  notStarted: number;
  /** Answered, not yet mastered */
  learning: number;
  mastered: number;
  /** Due today or overdue */
  dueToday: number;
  /** Due in the next 7 days, not counting today */
  dueThisWeek: number;
  /** Whole percent of all letters mastered, rounded down */
  percentMastered: number;
  families: FamilySummary[];
};

/**
 * @param letters all letters, in display order (FIDEL_LETTERS)
 * @param progress content_id → saved state (unknown ids are ignored)
 * @param today YYYY-MM-DD in the learner's local time
 */
export function summarizeProgress(
  letters: FidelLetter[],
  progress: Map<string, SrsState>,
  today: string
): ProgressSummary {
  const weekEnd = addDays(today, 7);
  const byFamily = new Map<string, FamilySummary>();
  let learning = 0;
  let mastered = 0;
  let dueToday = 0;
  let dueThisWeek = 0;

  for (const letter of letters) {
    let fam = byFamily.get(letter.family.id);
    if (!fam) {
      fam = { family: letter.family, total: 0, seen: 0, mastered: 0, due: 0 };
      byFamily.set(letter.family.id, fam);
    }
    fam.total++;

    const state = progress.get(letter.id);
    if (!state) continue;
    fam.seen++;
    if (state.status === "mastered") {
      mastered++;
      fam.mastered++;
    } else {
      learning++;
    }
    if (state.dueDate <= today) {
      dueToday++;
      fam.due++;
    } else if (state.dueDate <= weekEnd) {
      dueThisWeek++;
    }
  }

  const total = letters.length;
  return {
    total,
    notStarted: total - learning - mastered,
    learning,
    mastered,
    dueToday,
    dueThisWeek,
    percentMastered: total ? Math.floor((mastered * 100) / total) : 0,
    families: [...byFamily.values()],
  };
}
