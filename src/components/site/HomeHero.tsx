import Image from "next/image";
import { Box, Button, Container, Typography } from "@mui/material";

import Link from "@/components/NextLink";
import { school, TAGLINE } from "@/content/site";
import { BRAND_GOLD, BRAND_GREEN_DARK, HERO_GREEN, ON_GREEN } from "@/theme";

/**
 * The home page hero.
 *
 * The ground is the school's **own banner** — the artwork that already carries
 * the crest, the school name and the motto — under a deep-green scrim that is
 * strongest on the left, where the copy sits. That is deliberate: it is the one
 * genuine piece of the school's identity in an otherwise asset-less project,
 * and using it means the hero is the school rather than a stock photograph of
 * somebody else's classroom.
 *
 * The scrim does two jobs at once: it makes the white headline legible over a
 * bright photograph of a school building, and it lets the nav sit transparently
 * on top with its white links still readable.
 *
 * Server-safe: no state, no handlers.
 */
export default function HomeHero() {
  return (
    <Box
      component="section"
      aria-labelledby="home-hero-heading"
      sx={{
        position: "relative",
        backgroundColor: HERO_GREEN,
        // Clears the fixed nav, then gives the headline room to breathe.
        pt: { xs: 14, sm: 16, md: 20 },
        pb: { xs: 9, sm: 11, md: 14 },
        // `min(88vh, 780px)` rather than a bare `86vh`: at 900px tall that is
        // 780px, but on a tall monitor a pure `vh` value turns the hero into a
        // full screen of mostly empty green with the copy stranded in the
        // middle. The cap keeps the composition the same shape on every screen.
        minHeight: { xs: "auto", md: "min(88vh, 780px)" },
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Image
        src="/sms_background_image.png"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />

      {/* Two scrims: a vertical one so the bottom never washes out, and a
          left-weighted one so the copy column stays dark on every screen. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(8,62,40,0.86) 0%, rgba(11,81,48,0.62) 45%, rgba(8,62,40,0.92) 100%)`,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(100deg, rgba(8,62,40,0.94) 0%, rgba(8,62,40,0.78) 42%, rgba(8,62,40,0.28) 78%, rgba(8,62,40,0.12) 100%)`,
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ maxWidth: 760 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
            <Box
              aria-hidden
              sx={{ width: 32, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
            />
            <Typography variant="overline" sx={{ color: BRAND_GOLD }}>
              {school.town} &middot; {school.region} &middot; {school.country}
            </Typography>
          </Box>

          <Typography
            id="home-hero-heading"
            variant="h1"
            sx={{ color: "#FFFFFF", mb: 2.5, textShadow: "0 2px 24px rgba(0,0,0,0.28)" }}
          >
            {school.name}
          </Typography>

          <Typography
            component="p"
            sx={{
              fontSize: "clamp(1.125rem, 2.4vw, 1.6rem)",
              fontWeight: 600,
              color: "#FFFFFF",
              mb: 2.5,
              letterSpacing: "-0.01em",
            }}
          >
            A difference of{" "}
            <Box component="span" sx={{ position: "relative", display: "inline-block" }}>
              excellence
              <Box
                component="svg"
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                aria-hidden
                className="underline-draw"
                sx={{
                  position: "absolute",
                  left: 0,
                  bottom: -6,
                  width: "100%",
                  height: 10,
                  overflow: "visible",
                }}
              >
                <path
                  d="M2 8 C 60 2, 120 10, 180 5 S 272 3, 298 7"
                  fill="none"
                  stroke={BRAND_GOLD}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </Box>
            </Box>
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: ON_GREEN, mb: 4, maxWidth: 560, fontSize: "1.0625rem" }}
          >
            {TAGLINE} We have taught {school.levels} here since {school.founded}, across our{" "}
            {school.campuses.join(" and ")} campuses.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              component={Link}
              href="/admissions"
              variant="contained"
              size="large"
              sx={{
                backgroundColor: BRAND_GOLD,
                color: BRAND_GREEN_DARK,
                "&:hover": { backgroundColor: "#E0A800" },
              }}
            >
              Admissions
            </Button>

            <Button
              component={Link}
              href="/contact"
              variant="outlined"
              size="large"
              sx={{
                color: "#FFFFFF",
                borderColor: "rgba(244, 241, 232, 0.55)",
                "&:hover": {
                  borderColor: "#FFFFFF",
                  backgroundColor: "rgba(255,255,255,0.10)",
                },
              }}
            >
              Contact the school
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
