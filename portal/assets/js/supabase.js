// Supabase client — single instance, self-hosted supabase-js (pinned, like the Arabic fonts).
import { createClient } from "/vendor/supabase-esm.js";
import { SUPABASE_CONFIG } from "./config.js";

export const sb = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
