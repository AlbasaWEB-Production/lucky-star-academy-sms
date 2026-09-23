import SiteNotFound from "@/components/site/SiteNotFound";

/**
 * The application's not-found page.
 *
 * This is the one that actually runs for a URL matching no route — the common
 * case, since a mistyped public address has no route-group context and so never
 * reaches `(site)/not-found.tsx`.
 *
 * It renders the website's not-found screen, because the overwhelming majority
 * of wrong addresses belong to the public site. A mistyped *portal* address
 * lands here too, and the screen gives that visitor a sign-in link rather than
 * an apology, so neither has a dead end.
 *
 * Without this file the proxy's guard used to send unknown paths to `/login`,
 * which meant a parent who mistyped the school's address was shown a staff
 * sign-in form.
 */
export default function RootNotFound() {
  return <SiteNotFound />;
}
