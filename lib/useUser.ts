"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
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

    supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ user: data.session?.user ?? null, loading: false });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false });
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
