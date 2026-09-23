/**
 * Which hostname is the website, and which is the school management system.
 *
 * The deployment shape (chosen with the school before this was built):
 *
 *   luckystaracademy.edu.gh      -> the public website  (this route group)
 *   www.luckystaracademy.edu.gh  -> the public website
 *   portal.luckystaracademy.edu.gh -> the school management system
 *
 * The split is driven by two environment variables that are **deliberately
 * unset in development**:
 *
 *   NEXT_PUBLIC_SITE_HOST    e.g. luckystaracademy.edu.gh
 *   NEXT_PUBLIC_PORTAL_HOST  e.g. portal.luckystaracademy.edu.gh
 *
 * When they are unset — localhost, and every Vercel preview deployment — the app
 * behaves as a single-host application: the website is at `/` and the portal is
 * at `/admin`, `/teacher`, … exactly as before. That is what keeps previews
 * testable and means this change cannot strand anyone mid-review. The split
 * only switches on where the real domain is actually in front of the user.
 */

export const DEFAULT_SITE_HOST = "luckystaracademy.edu.gh";
export const DEFAULT_PORTAL_HOST = "portal.luckystaracademy.edu.gh";

function readHost(value: string | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed.replace(/^https?:\/\//, "").replace(/\/+$/, "") : undefined;
}

const configuredSiteHost = readHost(process.env.NEXT_PUBLIC_SITE_HOST);
const configuredPortalHost = readHost(process.env.NEXT_PUBLIC_PORTAL_HOST);

/** The website's canonical hostname. */
export const SITE_HOST = configuredSiteHost ?? DEFAULT_SITE_HOST;

/** The portal's hostname. */
export const PORTAL_HOST = configuredPortalHost ?? DEFAULT_PORTAL_HOST;

/**
 * True only when the portal host is configured, i.e. when this deployment
 * really does serve two hostnames.
 */
export const SPLIT_DEPLOYMENT = Boolean(configuredPortalHost);

export const SITE_ORIGIN = `https://${SITE_HOST}`;
export const PORTAL_ORIGIN = `https://${PORTAL_HOST}`;

/**
 * A link to the portal, correct in both deployment shapes.
 *
 * On a split deployment this must be absolute: a relative `/login` on the
 * website would take a parent to a login page served from the brochure's own
 * host. On a single-host deployment it stays relative, so localhost and preview
 * links keep working.
 */
export function portalHref(path = "/login"): string {
  return SPLIT_DEPLOYMENT ? `${PORTAL_ORIGIN}${path}` : path;
}

/** A link to the public website, correct in both deployment shapes. */
export function siteHref(path = "/"): string {
  return SPLIT_DEPLOYMENT ? `${SITE_ORIGIN}${path}` : path;
}

/**
 * The absolute URL of a public page, for `metadataBase`, Open Graph tags and
 * the sitemap. Always absolute, because none of those accept a relative path.
 */
export function absoluteSiteUrl(path = "/"): string {
  return `${SITE_ORIGIN}${path === "/" ? "" : path}`;
}

export type HostZone =
  /** The public website. */
  | "public"
  /** The school management system. */
  | "portal"
  /** One hostname serves both — localhost and previews. Change nothing. */
  | "single";

const SITE_HOSTS = [SITE_HOST, `www.${SITE_HOST}`];

/**
 * Classify an incoming `Host` header.
 *
 * Anything unrecognised — a `*.vercel.app` preview, `localhost:3000`, an IP, a
 * future custom domain — is `"single"`, which means the proxy applies no
 * host-based redirects at all. A request is only ever treated as portal traffic
 * when it arrives on the configured portal host by name, so a typo in the
 * environment cannot redirect the school's public website into the app.
 */
export function hostZone(hostHeader: string | null | undefined): HostZone {
  if (!SPLIT_DEPLOYMENT) return "single";

  const host = (hostHeader ?? "").split(":")[0].trim().toLowerCase();
  if (!host) return "single";
  if (host === PORTAL_HOST) return "portal";
  if (SITE_HOSTS.includes(host)) return "public";

  return "single";
}
