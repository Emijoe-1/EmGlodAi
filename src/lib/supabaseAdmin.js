import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security entirely.
// NEVER import this in a client component ("use client") or anything that runs
// in the browser, and never prefix this key with NEXT_PUBLIC_. This must only
// ever be used inside server-only files like API routes.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);