import type { MetadataRoute } from "next";

import { absoluteSiteUrl } from "@/lib/site/host";
import { PORTAL_PATHS } from "@/lib/site/routes";

/**
 * `robots.txt`.
 *
 * The default is to allow the whole public website and to disallow the portal.
 * That is belt *and* braces: every portal layout also sets `robots: noindex`
 * in its metadata, so even a crawler that ignores `robots.txt` is told not to
 * index the sign-in screens.
 *
 * Neither mechanism is a security control — the portal is protected by
 * authentication and Row Level Security, not by being unlisted. This only stops
 * a parent searching the school's name from landing on a staff login page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PORTAL_PATHS],
      },
    ],
    sitemap: absoluteSiteUrl("/sitemap.xml"),
  };
}
