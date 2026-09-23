import { redirect } from "next/navigation";

/**
 * `/schedule` has no screen of its own.
 *
 * The sidebar, the sign-in action and the landing page cards all point at a
 * concrete page, so this index exists only so a hand-typed `/schedule` lands
 * somewhere useful instead of 404-ing. Mirrors `roleHome.schedule_officer` in
 * `@/lib/auth/roles`.
 */
export default async function ScheduleOfficerIndexPage() {
  redirect("/schedule/dashboard");
}
