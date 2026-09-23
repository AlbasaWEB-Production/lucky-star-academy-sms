import type { UserRole } from "@/lib/supabase/database.types";

/**
 * Pure role metadata - the single place a role's URL, landing page and human
 * label are defined.
 *
 * This module is deliberately free of any server import: `UserRole` is a
 * *type-only* import, so nothing here reaches a runtime dependency. That
 * matters because `AppShell` is a client component and needs the human label,
 * while `session.ts` - which pulls in `next/headers` through the Supabase
 * server client - must never be dragged into a browser bundle.
 *
 * Adding a sixth role means adding one line to each record below and then
 * letting the compiler point at every `Record<UserRole, ...>` that needs it.
 */

/**
 * The URL segment a role's routes live under.
 *
 * Not always the role name: the role is `schedule_officer` in the database,
 * but a URL segment should not carry an underscore, so it routes under
 * `/schedule`. The database value is the authorization identity; this is only
 * the address.
 */
export const roleSlug: Record<UserRole, string> = {
  admin: "admin",
  teacher: "teacher",
  student: "student",
  accountant: "accountant",
  schedule_officer: "schedule",
};

/**
 * Path prefix each role is confined to.
 *
 * This is a routing convenience, not a security boundary - the real access
 * control is Row Level Security in the database. Someone who edits their way
 * past this guard still cannot read another school's rows.
 */
export const rolePrefix: Record<UserRole, string> = Object.fromEntries(
  (Object.keys(roleSlug) as UserRole[]).map((role) => [role, `/${roleSlug[role]}`]),
) as Record<UserRole, string>;

/** Where a role lands after signing in. Derived, so it cannot drift from `roleSlug`. */
export const roleHome: Record<UserRole, string> = Object.fromEntries(
  (Object.keys(roleSlug) as UserRole[]).map((role) => [role, `/${roleSlug[role]}/dashboard`]),
) as Record<UserRole, string>;

/** Human label for a role, for the shell's "… portal" line and for headings. */
export const roleLabel: Record<UserRole, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  student: "Student",
  accountant: "Accountant",
  schedule_officer: "Schedule Officer",
};

/**
 * The five portals in the order they are presented to a visitor - the landing
 * page cards, the sign-in chooser, and the sign-in page copy.
 *
 * Administrator, Teacher and Student keep their original 01-03 numbering, so
 * the two staff portals added later append as 04 and 05 rather than pushing
 * the pupil portal to the end. Existing printed hand-outs and screenshots of
 * this page therefore still read correctly.
 */
export const ROLE_ORDER: UserRole[] = [
  "admin",
  "teacher",
  "student",
  "accountant",
  "schedule_officer",
];

/**
 * The four roles that sign in with an email address and a password.
 *
 * `signInWithEmailAction` accepts an expected role from the submitted form and
 * compares it to the account's real `app_metadata.role`, so this list is what
 * stops the student portal from being driven through the email form.
 *
 * `EMAIL_SIGN_IN` is a `Record` over exactly the non-student roles, so adding a
 * sixth value to `user_role` is a compile error here until it is classified:
 * either it signs in with an email, or the type has to say why not.
 */
export type EmailSignInRole = Exclude<UserRole, "student">;

const EMAIL_SIGN_IN: Record<EmailSignInRole, true> = {
  admin: true,
  teacher: true,
  accountant: true,
  schedule_officer: true,
};

// `Object.keys` is typed `string[]`; the `Record<EmailSignInRole, true>` above
// is what actually constrains the set, so the cast here records that rather
// than widening the export.
export const EMAIL_SIGN_IN_ROLES: readonly UserRole[] = Object.keys(
  EMAIL_SIGN_IN,
) as EmailSignInRole[];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && value in roleSlug;
}
