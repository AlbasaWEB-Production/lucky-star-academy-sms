import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * The school slug is needed to build student login addresses, and it must be
 * read with a privileged client.
 *
 * Why the secret key here: a brand-new admin's school row is visible to them
 * under RLS, so reads would normally work. But slug lookups also happen in
 * flows that run before a session exists or after the user's claims changed,
 * and `schools` grants nothing to anon. Using the admin client makes the
 * lookup independent of the caller's token state.
 */
export async function schoolSlugOrThrow(schoolId: string): Promise<string> {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("schools")
    .select("slug")
    .eq("id", schoolId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "School not found.");
  }

  return data.slug;
}

/** School row as seen by the signed-in user (RLS-scoped). */
export async function getOwnSchool(schoolId: string) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("schools")
    .select("id, name, slug")
    .eq("id", schoolId)
    .maybeSingle();

  return data;
}
