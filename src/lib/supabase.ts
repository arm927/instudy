
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  throw new Error("Missing Supabase environment variables.");
}

let supabaseUrl: URL;

try {
  supabaseUrl = new URL(url);
} catch {
  throw new Error("Invalid Supabase URL. Check your .env.local file.");
}

if (
  !["https:", "http:"].includes(supabaseUrl.protocol) ||
  supabaseUrl.search ||
  supabaseUrl.hash
) {
  throw new Error("Invalid Supabase project URL.");
}

export const supabase = createClient(
  supabaseUrl.origin,
  key,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
