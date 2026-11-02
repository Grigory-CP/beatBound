import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

const missingVariables = [
  ["SUPABASE_URL", url],
  ["SUPABASE_SECRET_KEY", secretKey],
  ["SUPABASE_PUBLISHABLE_KEY", publishableKey]
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingVariables.length) {
  throw new Error(
    `Missing required environment variable(s): ${missingVariables.join(", ")}. Copy packages/backend/.env.example to packages/backend/.env and fill them in.`
  );
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };

// Bypasses RLS. Server-only. Import ONLY from src/services.
export const adminSupabase = createClient(url, secretKey, options);

export function newAuthClient() {
  return createClient(url, publishableKey, options);
}

export function createUserClient(accessToken) {
  return createClient(url, publishableKey, {
    ...options,
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
}
