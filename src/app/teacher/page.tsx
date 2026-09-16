import { redirect } from "next/navigation";

/**
 * `/teacher` has no screen of its own.
 *
 * The sidebar and every other portal link points at a concrete page, so this
 * index exists only so a hand-typed `/teacher` lands somewhere useful instead
 * of 404-ing. Mirrors `roleHome.teacher` in `@/lib/auth/session`.
 */
export default async function TeacherIndexPage() {
  redirect("/teacher/dashboard");
}
