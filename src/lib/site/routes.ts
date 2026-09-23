import { rolePrefix } from "@/lib/auth/roles";

/**
 * The public website's route table — the one place a public page's address and
 * its nav label are written down.
 *
 * The nav renders from `SITE_NAV`, `sitemap.ts` publishes `SITE_PATHS`, and
 * `src/proxy.ts` uses `isSitePath` to decide which requests belong to the
 * brochure and which belong to the school management system. Adding a page is
 * one entry here, not four edits in four files — the same reasoning as
 * `roleHome` in `@/lib/auth/roles` (see DECISIONS.md § 19).
 *
 * `href` doubles as the route path, so this list is the sitemap.
 */

export type SiteNavItem = {
  /** Route path, e.g. `/admissions`. */
  href: string;
  /** Nav label. Also the page's short title in the sitemap. */
  label: string;
};

export const SITE_NAV: readonly SiteNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/admissions", label: "Admissions" },
  { href: "/news", label: "News" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

/** Every public website path, including the home page. */
export const SITE_PATHS: readonly string[] = SITE_NAV.map((item) => item.href);

/**
 * Is `pathname` part of the public website?
 *
 * `/` is matched exactly rather than by prefix — `pathname.startsWith("/" + "/")`
 * would be `//`, which never matches, and a blanket `startsWith("/")` would
 * swallow the entire application.
 */
export function isSitePath(pathname: string): boolean {
  if (pathname === "/") return true;

  return SITE_PATHS.some(
    (path) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)),
  );
}

/**
 * Every path that belongs to the school management system rather than the
 * brochure: the auth screens, the first-run setup screen, and each role's
 * subtree.
 *
 * `rolePrefix` is imported rather than restated so a sixth role cannot be added
 * to the app and forgotten here — that omission would show up as an admin
 * dashboard served on the school's public domain, which is exactly the kind of
 * silent failure `DECISIONS.md` § 19 warns about.
 */
export const PORTAL_PATHS: readonly string[] = [
  "/login",
  "/register",
  "/setup-required",
  ...Object.values(rolePrefix),
];

/** Is `pathname` a sign-in, setup or role-portal route? */
export function isPortalPath(pathname: string): boolean {
  return PORTAL_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
