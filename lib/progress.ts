// Reading and saving Fidel progress in the Supabase `progress` table.
// Row-level security already limits every learner to their own rows.

import { supabase } from "@/lib/supabaseClient";
import type { SrsState, SrsStatus } from "@/lib/srs";

const CONTENT_TYPE = "script";

/** content_id (e.g. "hoy-4") → saved review state */
export type ProgressMap = Map<string, SrsState>;

type ProgressRow = {
  content_id: string;
  status: SrsStatus;
  srs_ease: number | string | null;
  srs_interval_days: number | null;
  srs_due_date: string;
};

export async function fetchScriptProgress(userId: string): Promise<ProgressMap> {
  const map: ProgressMap = new Map();
  if (!supabase) return map;
  const { data, error } = await supabase
    .from("progress")
    .select("content_id, status, srs_ease, srs_interval_days, srs_due_date")
    .eq("user_id", userId)
    .eq("content_type", CONTENT_TYPE);
  if (error) throw error;
  for (const row of (data ?? []) as ProgressRow[]) {
    map.set(row.content_id, {
      status: row.status === "mastered" ? "mastered" : "learning",
      ease: Number(row.srs_ease ?? 2.5), // numeric columns can arrive as strings
      intervalDays: row.srs_interval_days ?? 1,
      dueDate: row.srs_due_date,
    });
  }
  return map;
}

export async function saveLetterProgress(
  userId: string,
  letterId: string,
  state: SrsState
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("progress").upsert(
    {
      user_id: userId,
      content_type: CONTENT_TYPE,
      content_id: letterId,
      status: state.status,
      srs_ease: state.ease,
      srs_interval_days: state.intervalDays,
      srs_due_date: state.dueDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,content_type,content_id" }
  );
  if (error) throw error;
}
