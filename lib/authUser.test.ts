import { test } from "node:test";
import assert from "node:assert/strict";
import type { User } from "@supabase/supabase-js";

import { stableUser } from "./authUser";

function user(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    email: "a@example.com",
    updated_at: "2026-11-01T00:00:00Z",
    user_metadata: { full_name: "Abebe" },
    app_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as User;
}

test("keeps the old object when a token refresh returns the same user", () => {
  const prev = user();
  assert.equal(stableUser(prev, user()), prev);
});

test("switches to the new object when the account changes", () => {
  const next = user({ id: "u2" });
  assert.equal(stableUser(user(), next), next);
});

test("switches when the profile name or email changes", () => {
  const renamed = user({ user_metadata: { full_name: "Abebe K." } });
  assert.equal(stableUser(user(), renamed), renamed);
  const newEmail = user({ email: "b@example.com" });
  assert.equal(stableUser(user(), newEmail), newEmail);
});

test("handles signing in and out", () => {
  const next = user();
  assert.equal(stableUser(null, next), next);
  assert.equal(stableUser(user(), null), null);
  assert.equal(stableUser(null, null), null);
});
