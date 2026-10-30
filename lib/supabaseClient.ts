import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both Supabase env vars are set (see .env.example). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase environment variables are missing. Copy .env.example to .env.local and fill in your project values."
  );
}

/**
 * The shared Supabase client, or null when the env vars are missing.
 * createClient() throws on an empty URL, so creating it unconditionally
 * crashed the whole app before any page could show a helpful message.
 * Lessons that don't need an account (like the Fidel chart) keep working
 * without it.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
