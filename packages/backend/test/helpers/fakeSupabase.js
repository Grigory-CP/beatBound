import { vi } from "vitest";

// Test double for src/db/supabase.js, the only boundary system tests replace.
// Use it with:
//   vi.mock("../../src/db/supabase.js", () => import("../helpers/fakeSupabase.js"));
// Routes, middleware and services stay real; only the Supabase client is fake.

// Fake access tokens and the users they stand for (rows in public.users).
export const TEACHER = {
  token: "teacher-token",
  id: "teacher-samira",
  role: "TEACHER",
  displayName: "Ms. Samira"
};
export const STUDENT = {
  token: "student-token",
  id: "student-nova",
  role: "STUDENT",
  displayName: "Nova"
};
const USERS = [TEACHER, STUDENT];

export const adminSupabase = {
  rpc: vi.fn(),
  from: vi.fn(),
  auth: { getUser: vi.fn() }
};
export const createUserClient = vi.fn();
export const newAuthClient = vi.fn();

// A stand-in for a Supabase query builder: every filter returns the builder,
// and awaiting it (or calling maybeSingle/single) resolves to `result`.
export function fakeQuery(result) {
  const query = {};
  for (const method of ["select", "eq", "in", "order", "limit", "update"]) {
    query[method] = vi.fn(() => query);
  }
  query.maybeSingle = vi.fn(async () => result);
  query.single = vi.fn(async () => result);
  query.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
}

// The users-table lookup done by userFromToken:
// from("users").select("role, display_name").eq("user_id", id).maybeSingle()
function usersTable() {
  let userId;
  const query = fakeQuery(null);
  query.eq = vi.fn((column, value) => {
    if (column === "user_id") userId = value;
    return query;
  });
  query.maybeSingle = vi.fn(async () => {
    const user = USERS.find((u) => u.id === userId);
    return {
      data: user ? { role: user.role, display_name: user.displayName } : null,
      error: null
    };
  });
  return query;
}

// Clears recorded calls and installs the default behaviour: the fake tokens
// above are valid, any other token is rejected like an expired JWT, and
// no rpc or table other than "users" is expected unless a test sets one up.
export function resetFakeSupabase() {
  for (const fn of [
    adminSupabase.rpc,
    adminSupabase.from,
    adminSupabase.auth.getUser,
    createUserClient,
    newAuthClient
  ]) {
    fn.mockReset();
  }

  adminSupabase.auth.getUser.mockImplementation(async (token) => {
    const user = USERS.find((u) => u.token === token);
    return user
      ? { data: { user: { id: user.id } }, error: null }
      : { data: { user: null }, error: { message: "invalid JWT" } };
  });
  adminSupabase.from.mockImplementation((table) => {
    if (table === "users") return usersTable();
    throw new Error(`Unexpected adminSupabase.from("${table}") in test`);
  });
  adminSupabase.rpc.mockRejectedValue(new Error("Unexpected rpc in test"));
  createUserClient.mockImplementation((token) => ({
    token,
    from: vi.fn(() => {
      throw new Error("Unexpected user-scoped query in test");
    })
  }));
}
