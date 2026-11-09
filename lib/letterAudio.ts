// Letter recordings in the public Supabase Storage bucket "letter-audio"
// (see supabase/fix-002-letter-audio.sql). One file per letter:
//   fidel/hoy-4.webm   (or .mp4 / .ogg — whatever the browser recorded)

import { supabase } from "@/lib/supabaseClient";

const BUCKET = "letter-audio";
const FOLDER = "fidel";

/** letter id (e.g. "hoy-4") → playable URL */
export type AudioMap = Map<string, string>;

const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

/** File extension for a recorder MIME type like "audio/webm;codecs=opus". */
export function extensionFor(mimeType: string): string {
  return EXTENSIONS[mimeType.split(";")[0].trim()] ?? "webm";
}

/** All recordings. Missing bucket or no Supabase → empty map. */
export async function fetchLetterAudio(): Promise<AudioMap> {
  const map: AudioMap = new Map();
  if (!supabase) return map;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(FOLDER, { limit: 1000, sortBy: { column: "updated_at", order: "asc" } });
  if (error || !data) return map;
  for (const file of data) {
    const id = file.name.replace(/\.[^.]+$/, "");
    if (!id || id === file.name) continue;
    const { data: url } = supabase.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${file.name}`);
    // ?v= busts the browser cache after a re-recording
    const version = file.updated_at ? `?v=${encodeURIComponent(file.updated_at)}` : "";
    map.set(id, url.publicUrl + version); // later (newer) files win
  }
  return map;
}

/** Can this user record? Owner, or admin with the "audio" permission. */
export async function canManageAudio(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return false;
  const permissions: unknown = data.permissions;
  return (
    data.role === "owner" ||
    (data.role === "admin" && Array.isArray(permissions) && permissions.includes("audio"))
  );
}

/**
 * Save a recording for a letter, replacing any earlier one (including
 * one recorded in a different format). Returns the new playable URL.
 */
export async function uploadLetterAudio(letterId: string, blob: Blob): Promise<string> {
  if (!supabase) throw new Error("Supabase isn't configured");
  const ext = extensionFor(blob.type || "audio/webm");
  const path = `${FOLDER}/${letterId}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: blob.type.split(";")[0] || "audio/webm",
    cacheControl: "3600",
  });
  if (error) throw error;

  // Remove the same letter in other formats so only one version exists.
  const stale = Object.values(EXTENSIONS)
    .filter((e) => e !== ext)
    .map((e) => `${FOLDER}/${letterId}.${e}`);
  await supabase.storage.from(BUCKET).remove(stale);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
