import type { Metadata } from "next";
import { Box } from "@mui/material";

import SiteFooter from "@/components/site/SiteFooter";
import SiteNav from "@/components/site/SiteNav";
import UtilityBar from "@/components/site/UtilityBar";
import { school } from "@/content/site";
import { SITE_ORIGIN } from "@/lib/site/host";
import { SHARE_IMAGE } from "@/lib/site/metadata";

/**
 * The public website's layout.
 *
 * Everything under `src/app/(site)` is the school's brochure: it gets the
 * website's navigation and footer, its own metadata, and — importantly — it is
 * indexable. The portal layouts deliberately do not inherit any of that.
 *
 * The route group means the gate does not wrap `/admin`, `/teacher` or the auth
 * screens, so the school management system renders exactly as it did before.
 */

export const metadata: Metadata = {
  // Absolute URLs for Open Graph, canonical links and the sitemap. Without it
  // Next warns and emits relative OG image paths, which social platforms drop.
  metadataBase: new URL(SITE_ORIGIN),

  title: {
    // `default` says what a page with no title of its own is called. It is
    // augmented by the root layout's `%s | Lucky Star Academy SMS` template —
    // that is Next's documented behaviour, and it is why the home page sets its
    // title as `absolute` rather than relying on this. Every page in this group
    // sets its own title, so this value is only a safety net; the template
    // below is what those page titles actually pick up.
    default: `${school.name} — ${school.levels} in ${school.town}, Ghana`,
    template: `%s | ${school.name}`,
  },

  description:
    `${school.name} is a ${school.levels} school in ${school.town}, ${school.region}, Ghana. ` +
    `Established ${school.founded}. ${school.motto}.`,

  applicationName: school.name,

  keywords: [
    school.name,
    `school in ${school.town}`,
    `primary school ${school.town}`,
    `${school.levels} Ghana`,
    `${school.town} ${school.region}`,
    "basic school Ghana",
  ],

  authors: [{ name: school.name }],
  creator: school.name,
  publisher: school.name,

  alternates: { canonical: "/" },

  openGraph: {
    type: "website",
    siteName: school.name,
    locale: "en_GH",
    url: "/",
    title: `${school.name} — ${school.levels} in ${school.town}, Ghana`,
    description: `A ${school.levels} school in ${school.town}, ${school.region}, Ghana. ${school.motto}.`,
    images: [SHARE_IMAGE],
  },

  twitter: {
    card: "summary_large_image",
    title: `${school.name} — ${school.levels} in ${school.town}, Ghana`,
    description: `A ${school.levels} school in ${school.town}, ${school.region}, Ghana.`,
    images: [SHARE_IMAGE.url],
  },

  // The brochure is meant to be found. The portal is not — see the root layout,
  // which sets `noindex` as the default for everything outside this group.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  category: "education",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        backgroundColor: "background.default",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Blocks wrapped in <Reveal> start hidden and are unhidden by an
          IntersectionObserver. With JavaScript off nothing would ever unhide
          them, so this restores the final state for that case. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1 !important;transform:none !important;}`}</style>
      </noscript>

      {/* Keyboard users land here first. Visible only when focused. */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "absolute",
          left: -9999,
          top: 0,
          // A literal, not `(t) => t.zIndex.tooltip`. This layout is a Server
          // Component and MUI's Box is a Client Component, so an `sx` callback
          // is a function crossing that boundary — which Next rejects at
          // prerender with "Functions cannot be passed directly to Client
          // Components". 1500 is MUI's own tooltip layer.
          zIndex: 1500,
          backgroundColor: "background.paper",
          color: "secondary.main",
          px: 2,
          py: 1.5,
          borderRadius: "0 0 12px 0",
          fontWeight: 600,
          textDecoration: "none",
          "&:focus": { left: 0 },
        }}
      >
        Skip to content
      </Box>

      <UtilityBar />

      <SiteNav />

      <Box component="main" id="main-content" sx={{ flex: 1 }}>
        {children}
      </Box>

      <SiteFooter />
    </Box>
  );
}
