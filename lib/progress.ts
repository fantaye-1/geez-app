// Reading and saving progress (Fidel letters, vocabulary words) in the
// Supabase `progress` table. Row-level security already limits every
// learner to their own rows.

import { supabase } from "@/lib/supabaseClient";
import type { SrsState } from "@/lib/srs";
import {
  progressUpsert,
  rowsToProgress,
  type ContentType,
  type ProgressRow,
} from "@/lib/progressRows";

/** content_id (e.g. "hoy-4" or "vocab-qal") → saved review state */
export type ProgressMap = Map<string, SrsState>;

export async function fetchProgress(
  userId: string,
  contentType: ContentType
): Promise<ProgressMap> {
  if (!supabase) return new Map();
  const { data, error } = await supabase
    .from("progress")
    .select("content_id, status, srs_ease, srs_interval_days, srs_due_date")
    .eq("user_id", userId)
    .eq("content_type", contentType);
  if (error) throw error;
  return rowsToProgress((data ?? []) as ProgressRow[]);
}

export async function saveProgress(
  userId: string,
  contentType: ContentType,
  contentId: string,
  state: SrsState
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("progress")
    .upsert(progressUpsert(userId, contentType, contentId, state), {
      onConflict: "user_id,content_type,content_id",
    });
  if (error) throw error;
}

export function fetchScriptProgress(userId: string): Promise<ProgressMap> {
  return fetchProgress(userId, "script");
}

export function saveLetterProgress(userId: string, letterId: string, state: SrsState): Promise<void> {
  return saveProgress(userId, "script", letterId, state);
}

export function fetchVocabProgress(userId: string): Promise<ProgressMap> {
  return fetchProgress(userId, "vocabulary");
}

export function saveWordProgress(userId: string, wordId: string, state: SrsState): Promise<void> {
  return saveProgress(userId, "vocabulary", wordId, state);
}
