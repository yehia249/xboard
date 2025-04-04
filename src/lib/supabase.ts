// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hazcjgslrdoxjdwenrnw.supabase.co"    
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhemNqZ3NscmRveGpkd2Vucm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODI3MzUsImV4cCI6MjA1OTM1ODczNX0.kJVZiQb6JArkYWDfCoQ0fhBIriULDiIUAZ5e4S49j0g"

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
