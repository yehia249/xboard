// src/lib/supabaseAdmin.ts
// SERVER-ONLY CLIENT – can bypass RLS because it uses the service role key

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// this one is NOT public – put it in .env.local (NO NEXT_PUBLIC)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase admin client: missing env vars");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
