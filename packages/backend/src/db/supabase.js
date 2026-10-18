import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Copy packages/backend/.env.example to packages/backend/.env and fill it in."
  );
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };

// Shared server-side client: database queries + admin auth calls.
// The secret key bypasses Row Level Security, so this must never reach the browser.
export const supabase = createClient(url, secretKey, options);

// A fresh client for one sign-in / refresh, so logging a user in never
// changes the session of the shared client above.
export function newAuthClient() {
  return createClient(url, secretKey, options);
}
