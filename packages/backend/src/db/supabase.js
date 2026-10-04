import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Copy packages/backend/.env.example to packages/backend/.env and fill it in."
  );
}

// Server-side client. The secret key bypasses Row Level Security, so this
// client must only ever run on the backend, never in the browser.
export const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
