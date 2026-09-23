import { Box, Button, Container, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { type Metadata } from "next";

import HomeHero from "@/components/site/HomeHero";
import ProgrammeRow from "@/components/site/ProgrammeRow";
import PhotoFrame, { STOCK_PLACEHOLDER } from "@/components/site/PhotoFrame";
import Section, { SectionHeading } from "@/components/site/Section";
import StatsBand from "@/components/site/StatsBand";
import ValuesBand from "@/components/site/ValuesBand";
import { PendingBlock } from "@/components/site/DetailText";
import Link from "@/components/NextLink";
import { academics, aboutMiniStats, admissions, factCards, school, welcome } from "@/content/site";
import { JsonLd, schoolJsonLd } from "@/lib/site/structured-data";
import { BRAND_GOLD, BRAND_GREEN, BRAND_GREEN_DARK, HERO_GREEN } from "@/theme";

/**
 * The home page.
 *
 * The section order and the section design are the reference layout's — see
 * `SITE.md` § 7. Six movements:
 *
 *   hero (split, warm off-white)  →  values band (deep green, overlapping)
 *   →  about (copy, photograph, fact cards)  →  programmes (warm, five cards)
 *   →  numbers (deep green, full bleed)  →  admissions (photograph and copy)
 *
 * The reference's own home page carries no news strip, and neither does this
 * one; news has a page of its own, linked from the navigation and footer.
 *
 * Everything on it is the school's, or a visible placeholder. The one exception
 * is the photographs, which are stock stand-ins carrying a badge that says so —
 * the school's own banner is used where it can be, and `PLACEHOLDERS.md` records
 * that the rest must be replaced before launch.
 */

/**
 * The home page's title is `absolute` for a specific reason.
 *
 * A layout's `title.default` — which is what the home page would otherwise
 * inherit from `(site)/layout.tsx` — is augmented by the parent segment's
 * `title.template`. The parent here is the root layout, whose template is
 * `%s | Lucky Star Academy SMS`. The school's front page therefore came out as
 * "… | Lucky Star Academy SMS", advertising the management system in the search
 * result for the school itself.
 *
 * `title.absolute` ignores parent templates, so this is the one page that has
 * to state its title in full. Every other page sets its own title and correctly
 * picks up `%s | Lucky Star Academy` from the group layout.
 */
export const metadata: Metadata = {
  title: {
    absolute: `${school.name} — ${school.levels} in ${school.town}, Ghana`,
  },
  description: `${school.name} is a ${school.levels} school in ${school.town}, ${school.region}, Ghana. Established ${school.founded}. ${school.motto}.`,
};

const FACT_ICONS = {
  ratio: GroupsOutlinedIcon,
  clubs: SchoolOutlinedIcon,
  campuses: SchoolOutlinedIcon,
} as const;

export default function HomePage() {
  return (
    <>
      <JsonLd data={schoolJsonLd()} />

      <HomeHero />
      <ValuesBand />

      {/* About ---------------------------------------------------------- */}
      <Box component="section" aria-labelledby="home-about-heading" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "grid",
              gap: { xs: 5, md: 5 },
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1.06fr 1fr 0.62fr" },
              alignItems: "center",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Box
                  aria-hidden
                  sx={{ width: 28, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
                />
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  {welcome.overline}
                </Typography>
              </Box>

              <Typography
                id="home-about-heading"
                component="h2"
                sx={{
                  fontFamily: "var(--font-fraunces)",
                  fontWeight: 600,
                  fontSize: "clamp(1.875rem, 3.4vw, 2.625rem)",
                  lineHeight: 1.12,
                  letterSpacing: "-0.018em",
                  color: BRAND_GREEN_DARK,
                  mb: 2.5,
                }}
              >
                {welcome.heading}
              </Typography>

              <Box sx={{ maxWidth: 460, color: "text.secondary", lineHeight: 1.8 }}>
                <PendingBlock detail={welcome.body} fallback={welcome.bodyFallback} />
              </Box>

              <Button
                component={Link}
                href="/about"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  mt: 3,
                  backgroundColor: BRAND_GREEN_DARK,
                  color: "#FFFFFF",
                  "&:hover": { backgroundColor: HERO_GREEN },
                }}
              >
                Our story and values
              </Button>

              {/* The three figures. All of them are facts the school has stated. */}
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 2, md: 2.5 },
                  mt: 4,
                  flexWrap: "wrap",
                }}
              >
                {aboutMiniStats.map((stat, index) => (
                  <Box
                    key={stat.label}
                    sx={{
                      pr: { xs: 0, md: 2.5 },
                      borderRight: { xs: "none", md: "1px solid" },
                      borderColor: "divider",
                      "&:last-of-type": { borderRight: "none", pr: 0 },
                    }}
                  >
                    <Typography
                      component="strong"
                      sx={{
                        display: "block",
                        fontFamily: "var(--font-fraunces)",
                        fontSize: "1.375rem",
                        fontWeight: 600,
                        lineHeight: 1.2,
                        color: index === 2 ? "#AF7C12" : BRAND_GREEN_DARK,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ display: "block", fontSize: "0.75rem", color: "text.secondary", mt: 0.25 }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <PhotoFrame
              src={STOCK_PLACEHOLDER.src}
              alt=""
              objectPosition={STOCK_PLACEHOLDER.crops.window}
              aspectRatio={{ xs: "4 / 3", md: "4 / 3.4" }}
              sizes="(max-width: 899px) 100vw, 420px"
              radius="8px"
            />

            {/* The fact cards */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {factCards.map((fact) => {
                const Icon = FACT_ICONS[fact.key];

                return (
                  <Box
                    key={fact.key}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2.5,
                      backgroundColor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "14px",
                    }}
                  >
                    <Box aria-hidden sx={{ color: BRAND_GREEN_DARK, "& svg": { fontSize: 28 } }}>
                      <Icon />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      {fact.value.pending ? (
                        <Typography
                          component="div"
                          data-pending="true"
                          sx={{
                            fontStyle: "italic",
                            fontSize: "0.9375rem",
                            color: "text.secondary",
                            borderBottom: "1px dashed",
                            borderColor: "currentColor",
                            display: "inline-block",
                          }}
                        >
                          {fact.value.value}
                        </Typography>
                      ) : (
                        <Typography
                          component="strong"
                          sx={{
                            display: "block",
                            fontFamily: "var(--font-fraunces)",
                            fontSize: "1.375rem",
                            fontWeight: 600,
                            color: BRAND_GREEN_DARK,
                            lineHeight: 1.2,
                          }}
                        >
                          {fact.value.value}
                        </Typography>
                      )}
                      <Typography
                        component="span"
                        sx={{ display: "block", fontSize: "0.8125rem", color: "text.secondary", mt: 0.25 }}
                      >
                        {fact.label}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Programmes ----------------------------------------------------- */}
      <Box
        component="section"
        aria-labelledby="home-programmes-heading"
        sx={{ backgroundColor: "#FAF8F5", py: { xs: 8, md: 10 } }}
      >
        <Container maxWidth="lg">
          <SectionHeading
            id="home-programmes-heading"
            overline="Academics"
            title={academics.heading}
            lead={academics.lead}
            align="center"
          />

          <ProgrammeRow />

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 3,
              flexWrap: "wrap",
              mt: 5,
            }}
          >
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
              Every child has a path. Let&rsquo;s discover theirs.
            </Typography>
            <Link
              href="/academics"
              style={{
                color: BRAND_GREEN_DARK,
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              Explore academics
            </Link>
          </Box>
        </Container>
      </Box>

      {/* Numbers -------------------------------------------------------- */}
      <StatsBand />

      {/* Admissions ----------------------------------------------------- */}
      <Box
        component="section"
        aria-labelledby="home-admissions-heading"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" },
          backgroundColor: "#FBF8F2",
        }}
      >
        <Box sx={{ position: "relative", minHeight: { xs: 260, md: 360 } }}>
          <Box sx={{ position: "absolute", inset: 0 }}>
            <PhotoFrame
              src={STOCK_PLACEHOLDER.src}
              alt=""
              objectPosition={STOCK_PLACEHOLDER.crops.right}
              aspectRatio="auto"
              sizes="(max-width: 899px) 100vw, 45vw"
              radius="0"
              sx={{ height: "100%" }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            alignSelf: "center",
            px: { xs: 3, sm: 5, md: 7 },
            py: { xs: 6, md: 7 },
            maxWidth: 760,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box
              aria-hidden
              sx={{ width: 28, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
            />
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              Admissions
            </Typography>
          </Box>

          <Typography
            id="home-admissions-heading"
            component="h2"
            sx={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 600,
              fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)",
              lineHeight: 1.12,
              letterSpacing: "-0.018em",
              color: BRAND_GREEN_DARK,
              mb: 2,
            }}
          >
            Begin your journey <Box component="span" sx={{ color: "#C9992F" }}>toward a bright future.</Box>
          </Typography>

          <Typography sx={{ fontSize: "1rem", lineHeight: 1.75, color: "#5D6370", maxWidth: 460 }}>
            {admissions.lead}
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5, mt: 3.5, flexWrap: "wrap" }}>
            <Button
              component={Link}
              href="/admissions"
              variant="contained"
              startIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: BRAND_GREEN,
                color: "#FFFFFF",
                "&:hover": { backgroundColor: BRAND_GREEN_DARK },
              }}
            >
              How to apply
            </Button>

            <Button
              component={Link}
              href="/contact"
              variant="outlined"
              startIcon={<CalendarMonthOutlinedIcon />}
              sx={{
                color: BRAND_GREEN_DARK,
                borderColor: "rgba(8, 62, 40, 0.30)",
                "&:hover": { borderColor: BRAND_GREEN_DARK, backgroundColor: "rgba(8,62,40,0.04)" },
              }}
            >
              Arrange a visit
            </Button>
          </Box>

          <Typography variant="caption" sx={{ display: "block", mt: 4, color: "text.secondary" }}>
            <Box component="span" sx={{ color: BRAND_GOLD, fontWeight: 700 }}>
              ●{" "}
            </Box>
            {STOCK_PLACEHOLDER.credit}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
