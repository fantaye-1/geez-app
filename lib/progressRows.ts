// Converting between rows of the Supabase `progress` table and SrsState.
// Pure functions, no Supabase, so they're easy to test.

import type { SrsState } from "./srs";

/** Must match progress_content_type_check in supabase/setup.sql */
export type ContentType = "script" | "vocabulary" | "grammar" | "reading";

export type ProgressRow = {
  content_id: string;
  status: string;
  srs_ease: number | string | null;
  srs_interval_days: number | null;
  srs_due_date: string;
};

export type ProgressUpsert = {
  user_id: string;
  content_type: ContentType;
  content_id: string;
  status: SrsState["status"];
  srs_ease: number;
  srs_interval_days: number;
  srs_due_date: string;
  updated_at: string;
};

/** content_id → saved review state */
export function rowsToProgress(rows: ProgressRow[]): Map<string, SrsState> {
  const map = new Map<string, SrsState>();
  for (const row of rows) {
    map.set(row.content_id, {
      status: row.status === "mastered" ? "mastered" : "learning",
      ease: Number(row.srs_ease ?? 2.5), // numeric columns can arrive as strings
      intervalDays: row.srs_interval_days ?? 1,
      dueDate: row.srs_due_date,
    });
  }
  return map;
}

export function progressUpsert(
  userId: string,
  contentType: ContentType,
  contentId: string,
  state: SrsState,
  now: Date = new Date()
): ProgressUpsert {
  return {
    user_id: userId,
    content_type: contentType,
    content_id: contentId,
    status: state.status,
    srs_ease: state.ease,
    srs_interval_days: state.intervalDays,
    srs_due_date: state.dueDate,
    updated_at: now.toISOString(),
  };
}
