import { getStudentEmailDomain } from "@/lib/supabase/env";

/**
 * Students sign in with a roll number and their name, not with an email
 * address, but Supabase Auth identifies users by email or phone. Rather than
 * change the student experience, the server maps (roll number, name) to a
 * deterministic, unguessable-by-nobody address that the student never sees.
 *
 * Uniqueness holds because `schools.slug` is globally unique and
 * `students` enforces `unique (school_id, roll_number)`, so the combination
 * below can never collide across schools.
 *
 * The `+` separator is safe: slugs are constrained to [a-z0-9-], so `+`
 * cannot appear inside one and the split is unambiguous.
 */
export function studentLoginEmail(schoolSlug: string, rollNumber: number): string {
  return `${schoolSlug}+${rollNumber}@${getStudentEmailDomain()}`;
}

/**
 * Converts a school name into a slug satisfying the database constraint
 * `^[a-z0-9]+(-[a-z0-9]+)*$`.
 */
export function slugifySchoolName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  // The constraint requires at least one alphanumeric character.
  return slug.length > 0 ? slug : "school";
}

/**
 * Variant of the slug for the nth school with the same name, e.g. a second
 * "Greenwood High" becomes "greenwood-high-2".
 */
export function suffixedSlug(slug: string, attempt: number): string {
  return attempt <= 1 ? slug : `${slug}-${attempt}`;
}
