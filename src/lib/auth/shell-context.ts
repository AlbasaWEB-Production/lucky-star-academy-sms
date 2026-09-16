import "server-only";

import { redirect } from "next/navigation";

import { requireRoleWithTenant } from "@/lib/auth/session";
import { getSchool } from "@/lib/data/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UserRole } from "@/lib/supabase/database.types";

/**
 * Everything a role's layout needs to render the shell.
 *
 * Two guards in one place:
 *
 *  1. Before the Supabase project is connected, every dashboard route would
 *     throw on its first query. Redirecting to the landing page keeps the
 *     setup instructions reachable instead of showing a 500.
 *  2. `requireRoleWithTenant` enforces the role and guarantees a school id,
 *     so pages below can rely on `schoolId` being present.
 */
export async function loadShellContext(role: UserRole) {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const session = await requireRoleWithTenant(role);

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.id)
    .maybeSingle();

  const school = await getSchool(session.schoolId);

  return {
    session,
    // The profiles row is preferred over the app_metadata copy because it is
    // the value the admin edits; app_metadata is only the authorization copy.
    fullName: profile?.full_name ?? session.fullName ?? "Signed in",
    email: profile?.email ?? session.email ?? null,
    schoolName: school?.name ?? "Your school",
  };
}
