import type { Metadata } from "next";
import { Box, Typography } from "@mui/material";

import CTABand from "@/components/site/CTABand";
import Card from "@/components/site/Card";
import DetailText, { PendingBlock } from "@/components/site/DetailText";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import Section, { SectionHeading } from "@/components/site/Section";
import Link from "@/components/NextLink";
import { about, campuses, registrations, school, values } from "@/content/site";
import { pageMetadata } from "@/lib/site/metadata";
import { BRAND_GOLD, BRAND_GREEN, DISPLAY_FONT, ON_GREEN } from "@/theme";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: `${school.name} is a preschool and primary school in ${school.town}, ${school.region}, Ghana, teaching ${school.levels}. Established ${school.founded}. ${school.motto}.`,
  path: "/about",
});

/**
 * The About page.
 *
 * The structure is finished and the facts that exist are real; the narrative
 * sections the school must write for itself are held open by `PendingBlock`, so
 * the page is honest about what is missing rather than padded with copy nobody
 * at the school has approved.
 */
export default function AboutPage() {
  return (
    <>
      <PageHero overline="About us" title={about.heading} lead={about.lead} />

      {/* Our story ------------------------------------------------------ */}
      <Section tone="default" labelledBy="about-story-heading">
        <SectionHeading
          id="about-story-heading"
          overline="Our story"
          title="How the school began"
        />
        <Reveal>
          <PendingBlock
            detail={about.story.body}
            fallback={about.story.bodyFallback}
            sx={{
              maxWidth: 780,
              color: "text.secondary",
              fontSize: "1.0625rem",
              lineHeight: 1.75,
            }}
          />
        </Reveal>
      </Section>

      {/* Motto, mission, vision ---------------------------------------- */}
      <Section tone="paper" labelledBy="about-mission-heading">
        <SectionHeading
          id="about-mission-heading"
          overline="What we stand for"
          title="Our motto, mission and vision"
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          }}
        >
          {/* The motto is the one of the three the school has actually stated. */}
          <Reveal>
            <Card title="Our motto">
              <Typography
                sx={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: "1.375rem",
                  fontWeight: 600,
                  color: "secondary.main",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{school.motto}&rdquo;
              </Typography>
            </Card>
          </Reveal>

          <Reveal delayMs={80}>
            <Card title="Our mission">
              <DetailText detail={about.mission} sx={{ color: "text.secondary" }} />
            </Card>
          </Reveal>

          <Reveal delayMs={160}>
            <Card title="Our vision">
              <DetailText detail={about.vision} sx={{ color: "text.secondary" }} />
            </Card>
          </Reveal>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography
            component="h3"
            variant="h6"
            sx={{ color: "secondary.main", mb: 2, fontSize: "1.0625rem" }}
          >
            Our values
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr 1fr",
                sm: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(5, minmax(0, 1fr))",
              },
            }}
          >
            {values.map((value, index) => (
              <Box
                key={value}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "14px",
                  p: 2.5,
                }}
              >
                <Typography
                  aria-hidden
                  sx={{
                    fontFamily: "var(--font-fraunces)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#AF7C12",
                    mb: 0.5,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "var(--font-fraunces)",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "secondary.main",
                  }}
                >
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Section>

      {/* Campuses ------------------------------------------------------ */}
      <Section tone="green" labelledBy="about-campus-heading">
        <SectionHeading
          id="about-campus-heading"
          overline="Where we are"
          title="Two campuses in Yendi"
          lead={`Classes are held across our ${school.campuses.join(" and ")} campuses. The school office will tell you which campus your child's class sits at.`}
          onGreen
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            maxWidth: 820,
          }}
        >
          {campuses.map((campus) => (
            <Box
              key={campus.name}
              sx={{
                border: "1px solid rgba(244, 241, 232, 0.32)",
                borderRadius: "20px",
                p: 3,
              }}
            >
              <Box
                aria-hidden
                sx={{ width: 24, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999, mb: 1.5 }}
              />
              <Typography
                component="h3"
                variant="h6"
                sx={{ color: "#FFFFFF", mb: 1, fontSize: "1.0625rem" }}
              >
                {campus.name} Campus
              </Typography>
              <Typography variant="body2" sx={{ color: ON_GREEN, opacity: 0.95 }}>
                {campus.address}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="body2" sx={{ color: ON_GREEN, opacity: 0.85, mt: 3, maxWidth: 640 }}>
          Which classes and programmes are held at each campus:{" "}
          <DetailText detail={about.campusClasses} />
        </Typography>
      </Section>

      {/* Leadership and registration ----------------------------------- */}
      <Section tone="default" labelledBy="about-leadership-heading">
        <SectionHeading
          id="about-leadership-heading"
          overline="The school"
          title="Leadership and registration"
          lead="The people who lead the school, and the bodies it is registered with."
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" },
            alignItems: "start",
          }}
        >
          <Card title="Our staff">
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              The head teacher and the school office are listed on our staff page.
            </Typography>
            <Link
              href="/staff"
              style={{ color: BRAND_GREEN, fontWeight: 600, textDecoration: "underline" }}
            >
              Meet our staff &rarr;
            </Link>
          </Card>

          <Card title="Registration">
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              {school.name} is registered with:
            </Typography>

            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {registrations.map((body) => (
                <Box
                  key={body}
                  component="li"
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.25,
                    py: 0.75,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    "&:first-of-type": { borderTop: "none" },
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      color: BRAND_GREEN,
                      fontWeight: 700,
                      lineHeight: 1.6,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </Box>
                  <Typography variant="body2" sx={{ color: "text.primary" }}>
                    {body}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 2 }}>
              <DetailText detail={about.registrationNumbers} sx={{ color: "text.secondary" }} />
            </Box>
          </Card>
        </Box>
      </Section>

      <CTABand
        heading="Come and see the school"
        lead="Families are always welcome to visit, meet the teachers and look at a class before deciding."
        primaryLabel="Admissions"
        primaryHref="/admissions"
        secondaryLabel="Contact the office"
        secondaryHref="/contact"
      />
    </>
  );
}
