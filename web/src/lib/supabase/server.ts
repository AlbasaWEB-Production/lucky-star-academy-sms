import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * A new client must be created for every request - never cached or shared -
 * because the cookie adapter below is bound to this request's cookie store.
 *
 * The `getAll`/`setAll` pair (rather than the deprecated get/set/remove) is
 * required for correct token refresh: Supabase needs to be able to write a
 * refreshed session back, and the older API misses edge cases that show up as
 * random logouts.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot mutate cookies. This is expected and
          // safe: src/proxy.ts refreshes the session and writes the cookies
          // on every matched request, so nothing is lost here.
        }
      },
    },
  });
}
