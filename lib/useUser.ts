"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { stableUser } from "@/lib/authUser";
import { supabase } from "@/lib/supabaseClient";

export type UserState = {
  /** The signed-in user, or null when signed out */
  user: User | null;
  /** True until the first session check finishes */
  loading: boolean;
};

/**
 * Current Supabase user, kept in sync with sign-in / sign-out in any tab.
 * When Supabase isn't configured, everyone is simply signed out.
 */
export function useUser(): UserState {
  const [state, setState] = useState<UserState>({
    user: null,
    loading: Boolean(supabase),
  });

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    // Once an auth event has arrived it is newer than whatever getSession()
    // read, so a late getSession() result must not overwrite it.
    let heardEvent = false;

    const update = (user: User | null) =>
      setState((prev) => {
        const next = stableUser(prev.user, user);
        // Same account, already loaded → keep the same state object so
        // nothing re-renders or refetches.
        return next === prev.user && !prev.loading ? prev : { user: next, loading: false };
      });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active && !heardEvent) update(data.session?.user ?? null);
      })
      // Don't leave the app stuck "loading" if the session can't be read.
      .catch(() => {
        if (active && !heardEvent) update(null);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      heardEvent = true;
      if (active) update(session?.user ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** A friendly name for the header: their full name, else their email. */
export function displayName(user: User): string {
  const name = user.user_metadata?.full_name;
  return typeof name === "string" && name.trim() ? name.trim() : user.email ?? "Learner";
}
