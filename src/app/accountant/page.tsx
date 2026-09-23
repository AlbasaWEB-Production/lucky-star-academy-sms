import { redirect } from "next/navigation";

/**
 * `/accountant` has no screen of its own.
 *
 * The sidebar and the sign-in action both point at a concrete page, so this
 * index exists only so a hand-typed `/accountant` lands somewhere useful
 * instead of 404-ing. Mirrors `roleHome.accountant` in `@/lib/auth/roles`.
 */
export default async function AccountantIndexPage() {
  redirect("/accountant/dashboard");
}
