import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabaseSecretKey, getSupabaseUrl } from "./env";

/**
 * Privileged Supabase client, authenticated with the secret key.
 *
 * SECURITY: this client bypasses Row Level Security completely. The
 * `import "server-only"` above turns any accidental import from a Client
 * Component into a build error, which is the guard that keeps the secret key
 * out of the browser bundle.
 *
 * Use it only for operations that genuinely cannot be expressed under RLS:
 *
 *   - creating/deleting auth users (there is no RLS on auth.users)
 *   - setting app_metadata, which only the Auth admin API can write
 *   - the pre-login student lookup, which runs before a session exists
 *
 * Everything that a signed-in user could do under RLS should go through
 * src/lib/supabase/server.ts instead, so the policies remain the enforcement
 * point.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

/** Role and tenant claims mirrored onto a user's app_metadata. */
export type UserAppMetadata = {
  role: Database["public"]["Enums"]["user_role"];
  school_id: string;
  full_name?: string;
};

/**
 * Writes role and school_id into app_metadata.
 *
 * app_metadata is used rather than user_metadata because user_metadata is
 * writable by the signed-in user and would let anyone grant themselves the
 * admin role. Because RLS reads these claims straight from the JWT, a change
 * here does not affect an already-issued token: the user must sign in again
 * (or refresh) before the new claims take effect.
 */
export async function setUserAppMetadata(userId: string, metadata: UserAppMetadata) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: metadata,
  });

  if (error) {
    throw new Error(`Could not set app_metadata for user ${userId}: ${error.message}`);
  }
}
