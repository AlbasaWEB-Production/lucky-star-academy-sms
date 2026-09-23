import type { Metadata } from "next";

import { school } from "@/content/site";
import { absoluteSiteUrl } from "@/lib/site/host";

/**
 * The school's own banner, used as the link-preview image.
 *
 * Using the banner rather than a generated card means a shared link shows the
 * school's real identity — crest, name and motto — which is the whole point of
 * a preview image.
 */
export const SHARE_IMAGE = {
  url: "/sms_background_image.png",
  width: 1672,
  height: 941,
  alt: `${school.name} banner`,
} as const;

/**
 * Builds a public page's metadata.
 *
 * This exists because of a real bug, not for tidiness. Next merges metadata
 * **shallowly**: a nested object defined in a page replaces the parent layout's
 * object outright rather than merging into it. So the moment a page set
 * `openGraph: { url, title }`, the layout's `openGraph.images`, `siteName` and
 * `locale` disappeared with it — every inner page shipped with no `og:image` at
 * all, which is exactly what a school shares on WhatsApp and Facebook.
 *
 * Nothing about that failure is visible in the page. It only shows up when a
 * link is actually pasted into a chat, so it would have been found by the
 * school rather than by us.
 *
 * Pages now call this instead of hand-writing an `openGraph` block, so the
 * shared fields cannot be dropped one page at a time.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  /** Short page title. Rendered as `"<title> | Lucky Star Academy"`. */
  title: string;
  description: string;
  /** Route path, e.g. `/admissions`. */
  path: string;
}): Metadata {
  const socialTitle = `${title} | ${school.name}`;

  return {
    title,
    description,

    alternates: { canonical: path },

    openGraph: {
      type: "website",
      siteName: school.name,
      locale: "en_GH",
      url: absoluteSiteUrl(path),
      title: socialTitle,
      description,
      images: [SHARE_IMAGE],
    },

    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [SHARE_IMAGE.url],
    },
  };
}
