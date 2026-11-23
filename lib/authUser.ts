import type { User } from "@supabase/supabase-js";

/**
 * Supabase hands out a fresh `user` object on every auth event, including
 * the hourly token refresh and the SIGNED_IN it fires when a tab regains
 * focus. Pages load progress in `useEffect(..., [user])`, so each new
 * object wiped their state and refetched it, even though nobody signed in
 * or out.
 *
 * Returns `prev` when `next` is the same account with the same details, so
 * React sees no change; otherwise returns `next`.
 */
export function stableUser(prev: User | null, next: User | null): User | null {
  if (!prev || !next) return next;
  const same =
    prev.id === next.id &&
    prev.email === next.email &&
    prev.updated_at === next.updated_at &&
    JSON.stringify(prev.user_metadata ?? {}) === JSON.stringify(next.user_metadata ?? {});
  return same ? prev : next;
}
