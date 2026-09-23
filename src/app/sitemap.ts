import type { MetadataRoute } from "next";

import { absoluteSiteUrl } from "@/lib/site/host";
import { SITE_NAV } from "@/lib/site/routes";

/**
 * The sitemap.
 *
 * Only the public website's pages appear. The portal is deliberately absent:
 * every route behind it requires a session, so listing it would just invite a
 * crawler to index a redirect to a login screen.
 *
 * `SITE_NAV` is the source, so a page added to the navigation is in the sitemap
 * without a second edit.
 *
 * `changeFrequency` and `priority` are deliberately omitted. Both are ignored by
 * Google, and a guessed priority is a claim about content importance that
 * nothing here is entitled to make.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return SITE_NAV.map((item) => ({
    url: absoluteSiteUrl(item.href),
    lastModified,
  }));
}
