import { Box, Button, Container, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";

import Link from "@/components/NextLink";
import PhotoFrame from "@/components/site/PhotoFrame";
import { legacyCard, school, TAGLINE } from "@/content/site";
import { BRAND_GOLD, BRAND_GREEN_DARK, HERO_GREEN, INK } from "@/theme";

/**
 * The home page hero — the reference layout's split hero.
 *
 * Copy on the left over a warm off-white ground, the photograph on the right,
 * and a small "legacy" card hanging off the image's lower edge carrying the
 * founding year.
 *
 * **The photograph is the school's own banner, not a stock image.** It is the
 * one genuine asset in the repository, and it shows real Lucky Star pupils
 * working with a robotics kit. It is cropped hard to the right so that the
 * banner's own baked-in crest and school name fall outside the frame — the
 * alternative is a heading that reads "Lucky Star Academy" beside artwork that
 * also reads "Lucky Star Academy", which looks like a mistake.
 *
 * The two-line headline is the reference's treatment ("Inspiring Minds. /
 * Shaping Futures."). Here the first line is the school's name, because the
 * page's `h1` should say what the page is about, and the second is its actual
 * motto — which the school has stated, on its own banner.
 *
 * Server component: no state, no handlers.
 */
export default function HomeHero() {
  return (
    <Box
      component="section"
      aria-labelledby="home-hero-heading"
      sx={{
        position: "relative",
        backgroundColor: "#FAF9F7",
        overflow: "hidden",
        // A soft ground behind the copy column, so the image can bleed
        // slightly wider than the text without a hard seam.
        backgroundImage: {
          md: `linear-gradient(90deg, #FAF9F7 0%, #FAF9F7 52%, rgba(250,249,247,0.55) 62%, rgba(250,249,247,0) 78%)`,
        },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gap: { xs: 5, md: 5 },
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
            alignItems: "center",
            pt: { xs: 6, md: 8 },
            pb: { xs: 6, md: 8 },
          }}
        >
          {/* Copy ------------------------------------------------------- */}
          <Box sx={{ position: "relative", zIndex: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                aria-hidden
                sx={{ width: 30, height: 1, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
              />
              <Typography
                variant="overline"
                sx={{ color: "#AF7C12", fontWeight: 700, letterSpacing: "0.16em" }}
              >
                {school.town} &middot; {school.region} &middot; {school.country}
              </Typography>
            </Box>

            <Typography
              id="home-hero-heading"
              component="h1"
              sx={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 600,
                fontSize: "clamp(2.375rem, 5vw, 4.25rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.028em",
                color: BRAND_GREEN_DARK,
                m: 0,
              }}
            >
              {school.name}
              <Box component="span" sx={{ display: "block", color: "#C9992F" }}>
                {school.motto}
              </Box>
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 3,
                maxWidth: 480,
                fontSize: "1.0625rem",
                lineHeight: 1.75,
                color: "#39465A",
              }}
            >
              {TAGLINE} We have taught {school.levels} here since {school.founded}, across our{" "}
              {school.campuses.join(" and ")} campuses.
            </Typography>

            <Box sx={{ display: "flex", gap: 1.5, mt: 3.5, flexWrap: "wrap" }}>
              <Button
                component={Link}
                href="/about"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  backgroundColor: BRAND_GREEN_DARK,
                  color: "#FFFFFF",
                  "&:hover": { backgroundColor: HERO_GREEN },
                }}
              >
                Discover our school
              </Button>

              <Button
                component={Link}
                href="/gallery"
                variant="outlined"
                size="large"
                startIcon={<SchoolOutlinedIcon />}
                sx={{
                  color: BRAND_GREEN_DARK,
                  borderColor: "rgba(8, 62, 40, 0.35)",
                  "&:hover": { borderColor: BRAND_GREEN_DARK, backgroundColor: "rgba(8,62,40,0.04)" },
                }}
              >
                Explore the school
              </Button>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 3 }}>
              <Box
                aria-hidden
                sx={{ width: 22, height: 1, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Two campuses in {school.town} &middot; Established {school.founded}
              </Typography>
            </Box>
          </Box>

          {/* Photograph and legacy card --------------------------------- */}
          <Box sx={{ position: "relative" }}>
            <PhotoFrame
              src="/sms_background_image.png"
              alt={`Pupils of ${school.name} working together at a desk`}
              // Cropped right, away from the banner's own baked-in crest and
              // school name, so the artwork does not repeat the heading.
              objectPosition="74% 52%"
              aspectRatio={{ xs: "4 / 3", md: "4 / 4.6" }}
              sizes="(max-width: 899px) 100vw, 640px"
              stock={false}
              priority
              radius="8px"
            />

            {/* The legacy card. In the flow on a phone, hanging off the
                image's lower-left corner from md up. */}
            <Box
              sx={{
                mt: { xs: 2, md: 0 },
                position: { md: "absolute" },
                left: { md: -32 },
                bottom: { md: 44 },
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: { xs: 2.5, md: 3 },
                py: { xs: 2, md: 2.5 },
                backgroundColor: "#FFFFFF",
                borderRadius: "6px",
                boxShadow: "0 8px 34px rgba(0, 19, 45, 0.10)",
                minWidth: { md: 232 },
              }}
            >
              <Box aria-hidden sx={{ color: "#AF7C12", "& svg": { fontSize: 42 } }}>
                <WorkspacePremiumOutlinedIcon />
              </Box>
              <Box>
                <Typography
                  component="span"
                  sx={{ display: "block", fontSize: "0.75rem", lineHeight: 1.6, color: INK }}
                >
                  {legacyCard.lead}
                </Typography>
                <Typography
                  component="strong"
                  sx={{
                    display: "block",
                    fontFamily: "var(--font-fraunces)",
                    fontSize: "1.625rem",
                    fontWeight: 600,
                    lineHeight: 1.1,
                    color: BRAND_GREEN_DARK,
                  }}
                >
                  {legacyCard.emphasis}
                </Typography>
                <Typography
                  component="span"
                  sx={{ display: "block", fontSize: "0.75rem", lineHeight: 1.6, color: INK }}
                >
                  {legacyCard.since}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
