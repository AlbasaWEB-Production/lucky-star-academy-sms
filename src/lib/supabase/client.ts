"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Supabase client for use in Client Components.
 *
 * Holds only the publishable (anon) key. Every query it makes is still
 * subject to Row Level Security, so a compromised browser session cannot read
 * outside the user's own school.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
