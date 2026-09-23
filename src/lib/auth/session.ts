import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/database.types";
import { isUserRole, roleHome } from "./roles";

export type SessionUser = {
  id: string;
  email: string | null;
  role: UserRole;
  schoolId: string | null;
  fullName: string | null;
};

export { roleHome, roleLabel, roleSlug, rolePrefix, isUserRole } from "./roles";

/**
 * Reads the signed-in user for this request.
 *
 * Wrapped in React `cache` so several components in one render pass share a
 * single lookup instead of each hitting the Auth server.
 *
 * `getUser()` is used rather than `getSession()`: getSession reads the cookie
 * without validating it, so it must never be trusted for authorization. (For
 * latency-sensitive deployments, `getClaims()` verifies an asymmetric JWT
 * locally and is a drop-in alternative here.)
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // app_metadata, not user_metadata: user_metadata is writable by the user.
  const metadata = user.app_metadata as Record<string, unknown> | undefined;
  const role = metadata?.role;
  const schoolId = metadata?.school_id;

  return {
    id: user.id,
    email: user.email ?? null,
    // A user whose app_metadata is missing or malformed has no usable role.
    // Treat them as signed out rather than defaulting to a privileged role.
    role: isUserRole(role) ? role : "student",
    schoolId: typeof schoolId === "string" ? schoolId : null,
    fullName: typeof metadata?.full_name === "string" ? metadata.full_name : null,
  };
});

/** Returns the signed-in user or null. Never redirects. */
export async function getOptionalSessionUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/** Requires a signed-in user, redirecting to the login page otherwise. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Requires a signed-in user with a specific role.
 *
 * A signed-in user with the wrong role is redirected to their own dashboard
 * rather than to the login page, so a mistyped URL does not look like a
 * logout.
 */
export async function requireRole(role: UserRole): Promise<SessionUser> {
  const user = await requireSessionUser();

  if (user.role !== role) {
    redirect(roleHome[user.role]);
  }

  return user;
}

/**
 * Requires a signed-in user whose tenant is known.
 *
 * Every tenant-owned query needs `school_id`, so callers get a narrowed type
 * instead of a nullable id they would otherwise have to re-check.
 */
export async function requireTenant(): Promise<SessionUser & { schoolId: string }> {
  const user = await requireSessionUser();

  if (!user.schoolId) {
    // Reachable if app_metadata was never written (for example a user created
    // by hand in the Supabase Dashboard rather than through registration).
    redirect("/setup-required");
  }

  return { ...user, schoolId: user.schoolId };
}

/** Requires a signed-in user of a role, with a tenant. */
export async function requireRoleWithTenant(
  role: UserRole,
): Promise<SessionUser & { schoolId: string }> {
  const user = await requireTenant();

  if (user.role !== role) {
    redirect(roleHome[user.role]);
  }

  return user;
}

/**
 * Requires a signed-in staff member allowed to touch academic records - an
 * admin or a teacher - with a tenant.
 *
 * Used by the actions those two roles share: recording attendance and marks.
 * Which rows each role may actually touch is still decided by RLS: an admin
 * covers the whole school, a teacher only the subjects they are assigned to.
 *
 * The accountant and the schedule officer are deliberately NOT staff here.
 * They are not academic record-keepers, so they are redirected rather than
 * being let through to fail on an RLS policy - see `requireFinanceWithTenant`
 * and `requireTimetableWithTenant` for the guards that do cover them.
 */
export async function requireStaffWithTenant(): Promise<SessionUser & { schoolId: string }> {
  const user = await requireTenant();

  if (user.role !== "admin" && user.role !== "teacher") {
    redirect(roleHome[user.role]);
  }

  return user;
}

/**
 * Requires a signed-in user who keeps the books - an admin or the accountant.
 *
 * Finance writes (banking a payment, recording an expense, issuing a fee
 * assessment) go through this guard. RLS is still what decides the rows: an
 * admin may also set fee structures and budgets, the accountant may not.
 */
export async function requireFinanceWithTenant(): Promise<SessionUser & { schoolId: string }> {
  const user = await requireTenant();

  if (user.role !== "admin" && user.role !== "accountant") {
    redirect(roleHome[user.role]);
  }

  return user;
}

/**
 * Requires a signed-in user who owns the timetable - an admin or the schedule
 * officer. This is what the timetable write actions check.
 */
export async function requireTimetableWithTenant(): Promise<SessionUser & { schoolId: string }> {
  const user = await requireTenant();

  if (user.role !== "admin" && user.role !== "schedule_officer") {
    redirect(roleHome[user.role]);
  }

  return user;
}
