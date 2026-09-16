import Image from "next/image";
import { Box, Button, Container, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import Link from "@/components/NextLink";
import SetupBanner from "@/components/SetupBanner";
import { BRAND_GOLD, BRAND_GREEN_DARK, HERO_GREEN, ON_GREEN } from "@/theme";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * The landing hero.
 *
 * Full-bleed on the school's own banner photograph, over a saturated green
 * ground. The banner already carries the crest and the school name, so the copy
 * sits low in the left band and never collides with them, and the page draws no
 * second lockup here.
 *
 * This is the one element that overlaps a section boundary: the gold star seal
 * hangs below the hero and onto the portals section below it (the hero is at
 * z-index 2, the portals at 1), which is what stops the page reading as a stack
 * of separate boxes.
 */
const STAR_PATH =
  "M12 1.6l3.09 6.26 6.91.99-5.000 4.87 1.18 6.88L12 17.35 5.82 20.60 7 13.72l-5-4.87 6.91-.99z";

export default function HomeHero() {
  return (
    <Box
      component="section"
      className="grain"
      aria-labelledby="home-hero-heading"
      sx={{
        position: "relative",
        zIndex: 2,
        backgroundColor: HERO_GREEN,
        minHeight: { xs: "94svh", md: "100svh" },
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        // The copy is anchored low so it clears the crest that the banner
        // already carries in its top-left, rather than sitting on top of it.
        pt: { xs: 12, md: 14 },
        pb: { xs: 9, md: 8 },
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

      {/* Scrims: a dark top band so the nav's white links stay legible over the
          bright school building, and a deep-green wash from the left where the
          headline sits. */}
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

      {/* A phone crops the banner to its middle, so the copy lands on the
          photograph rather than on the green band; this carries the contrast. */}
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

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, width: "100%" }}>
        <Box sx={{ maxWidth: { xs: "100%", md: 680 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
            <Box
              aria-hidden
              sx={{ width: 28, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
            />
            <Typography variant="overline" sx={{ color: ON_GREEN }}>
              Lucky Star Academy &middot; Yendi, Ghana
            </Typography>
          </Box>

          <Typography
            id="home-hero-heading"
            component="h1"
            variant="h1"
            sx={{ color: "#FFFFFF", mb: 3, textWrap: "balance" }}
          >
            School management, streamlined for{" "}
            <Box
              component="span"
              className="underline-draw"
              sx={{ position: "relative", display: "inline-block" }}
            >
              every classroom.
              <Box
                component="svg"
                aria-hidden
                viewBox="0 0 300 18"
                preserveAspectRatio="none"
                sx={{
                  position: "absolute",
                  left: "-1%",
                  bottom: "-0.12em",
                  width: "102%",
                  height: "0.16em",
                  overflow: "visible",
                }}
              >
                <path
                  d="M4 12C58 4 118 15 176 8C224 2.4 262 4 296 10"
                  fill="none"
                  stroke={BRAND_GOLD}
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </Box>
            </Box>
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: ON_GREEN, maxWidth: 540, mb: 4, fontSize: { xs: "1rem", md: "1.0625rem" } }}
          >
            Lucky Star Academy, Yendi &middot; Primary 1&ndash;6. Class organization, attendance,
            exam marks and communication &mdash; one place for students, teachers and
            administrators.
          </Typography>

          <Button
            component={Link}
            href="/login"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              backgroundColor: BRAND_GOLD,
              color: BRAND_GREEN_DARK,
              fontSize: "1.0625rem",
              px: 3.5,
              "&:hover": { backgroundColor: "#E0A800" },
              "&:focus-visible": {
                outline: "3px solid #FFFFFF",
                outlineOffset: 3,
              },
            }}
          >
            Sign in
          </Button>

          <Box sx={{ mt: 5 }}>
            <SetupBanner configured={isSupabaseConfigured()} />
          </Box>
        </Box>
      </Container>

      {/* The gold seal that breaks the section boundary. Decorative: the same
          information is in the eyebrow and the heading. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          zIndex: 3,
          bottom: -46,
          left: { xs: 20, md: "max(24px, calc(50% - 600px + 24px))" },
          width: { xs: 76, md: 92 },
          height: { xs: 76, md: 92 },
          borderRadius: "50%",
          backgroundColor: BRAND_GOLD,
          display: "grid",
          placeItems: "center",
          transform: "rotate(-8deg)",
          boxShadow: "0 12px 28px rgba(8, 62, 40, 0.28)",
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 24 24"
          sx={{ width: { xs: 34, md: 42 }, height: { xs: 34, md: 42 }, display: "block" }}
        >
          <path d={STAR_PATH} fill={HERO_GREEN} />
        </Box>
      </Box>
    </Box>
  );
}
