import Image from "next/image";
import { Box, Container, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import PortalCard from "@/components/portals/PortalCard";
import { PORTAL_CARDS, SIGN_IN_NOTE } from "@/components/portals/portals";
import Link from "@/components/NextLink";
import SiteFooter from "@/components/ui/SiteFooter";
import { BRAND_GOLD, BRAND_GREEN_DARK, HERO_GREEN, ON_GREEN, PAGE_BG } from "@/theme";

export const metadata = {
  title: "Sign in",
};

/**
 * The sign-in chooser — the landing page's first two movements, shorter.
 *
 * It previously looked a redesign older than `/`: a small centred `h5` over the
 * banner, and five plain `Paper` rows each with its own "Continue" button
 * beside it. That was a second, hand-maintained rendering of the same five
 * portals, and it had simply not been carried forward when the landing page was
 * rebuilt.
 *
 * It now reuses the landing page's ground and its actual card component, so the
 * two pages cannot disagree again:
 *
 *   - the saturating `HERO_GREEN` band over the school's own banner, with the
 *     same two scrims as `HomeHero`, so the photograph reads identically;
 *   - a light portals band carrying `PortalCard` from
 *     `@/components/portals/PortalCard` — the same component the landing page
 *     renders — with the same words on each card.
 *
 * The hero band is `auto` height rather than the landing page's `100svh`: this
 * page's job is the doors below it, so the band introduces them instead of
 * filling a screen first.
 *
 * `SIGN_IN_NOTE` is the one thing this page adds, because how each role signs
 * in is the question a visitor here is actually asking. It is one sentence
 * rather than a note per card: four of the five use an email address, so the
 * thing worth noticing is the odd one out.
 */
export default function LoginChooserPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: PAGE_BG,
      }}
    >
      {/* Movement 1 — the sign-in hero, on the landing page's ground. */}
      <Box
        component="section"
        aria-labelledby="login-heading"
        sx={{
          position: "relative",
          backgroundColor: HERO_GREEN,
          overflow: "hidden",
          pt: { xs: 8, md: 10 },
          pb: { xs: 7, md: 9 },
        }}
      >
        <Image
          src="/sms_background_image.png"
          alt="Three Lucky Star Academy pupils in school uniform building a robot together from a laptop, with the school's green and yellow building and the Ghanaian flag behind them"
          fill
          // Next 16 replaced `priority` with `preload`; this is the LCP image.
          preload
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />

        {/* The same two scrims as HomeHero — a dark top band, and a deep-green
            wash from the left where the copy sits. Kept in step with it so the
            photograph reads the same on both pages. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background: [
              "linear-gradient(180deg, rgba(8, 62, 40, 0.55) 0%, rgba(8, 62, 40, 0) 18%)",
              "linear-gradient(90deg, rgba(11, 81, 48, 0.95) 0%, rgba(11, 81, 48, 0.80) 34%, rgba(11, 81, 48, 0.32) 58%, rgba(11, 81, 48, 0) 80%)",
            ].join(", "),
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            display: { xs: "block", md: "none" },
            background:
              "linear-gradient(180deg, rgba(11, 81, 48, 0.34) 0%, rgba(11, 81, 48, 0.78) 52%, rgba(11, 81, 48, 0.95) 100%)",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ maxWidth: { xs: "100%", md: 620 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box
                aria-hidden
                sx={{ width: 28, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
              />
              <Typography variant="overline" sx={{ color: ON_GREEN }}>
                Lucky Star Academy &middot; Sign in
              </Typography>
            </Box>

            <Typography
              id="login-heading"
              component="h1"
              variant="h2"
              sx={{ color: "#FFFFFF", mb: 2.5, textWrap: "balance" }}
            >
              Choose your portal.
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: ON_GREEN,
                maxWidth: 540,
                mb: 3.5,
                fontSize: { xs: "1rem", md: "1.0625rem" },
              }}
            >
              {SIGN_IN_NOTE}
            </Typography>

            {/* A pre-auth page needs a way back, and the landing page's hero
                button is the door in. This is the matching door out. */}
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: ON_GREEN,
                fontWeight: 600,
                textDecorationColor: BRAND_GOLD,
                textUnderlineOffset: 3,
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18 }} aria-hidden />
              Back to the school&rsquo;s home page
            </Link>
          </Box>
        </Container>
      </Box>

      {/* Movement 2 — the same doors the landing page shows, on the light
          ground, drawn by the same component. */}
      <Box
        component="section"
        aria-labelledby="login-portals-heading"
        sx={{ flex: 1, backgroundColor: PAGE_BG, py: { xs: 8, md: 10 } }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box
              aria-hidden
              sx={{ width: 28, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
            />
            <Typography variant="overline" color="text.secondary">
              Portals
            </Typography>
          </Box>

          <Typography
            id="login-portals-heading"
            variant="h2"
            sx={{ mb: 1.5, color: BRAND_GREEN_DARK }}
          >
            Which one are you?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 560 }}>
            Pick the portal that matches your account. If you are not sure, your school office can
            tell you which one was set up for you.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            }}
          >
            {PORTAL_CARDS.map((portal) => (
              <PortalCard key={portal.href} portal={portal} />
            ))}
          </Box>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}
