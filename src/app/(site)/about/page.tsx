import type { Metadata } from "next";
import { Box, Typography } from "@mui/material";

import CTABand from "@/components/site/CTABand";
import Card from "@/components/site/Card";
import DetailText, { PendingBlock } from "@/components/site/DetailText";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import Section, { SectionHeading } from "@/components/site/Section";
import { about, school } from "@/content/site";
import { pageMetadata } from "@/lib/site/metadata";
import { BRAND_GOLD, DISPLAY_FONT, ON_GREEN } from "@/theme";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: `${school.name} is a ${school.levels} school in ${school.town}, ${school.region}, Ghana. Established ${school.founded}. ${school.motto}.`,
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
            sx={{ color: "secondary.main", mb: 1.5, fontSize: "1.0625rem" }}
          >
            Our values
          </Typography>
          <PendingBlock detail={about.values.items} />
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
            maxWidth: 720,
          }}
        >
          {school.campuses.map((campus) => (
            <Box
              key={campus}
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
                {campus} campus
              </Typography>
              <Typography variant="body2" sx={{ color: ON_GREEN, opacity: 0.9 }}>
                <DetailText detail={about.campusClasses} />
              </Typography>
            </Box>
          ))}
        </Box>
      </Section>

      {/* Leadership and registration ----------------------------------- */}
      <Section tone="default" labelledBy="about-leadership-heading">
        <SectionHeading
          id="about-leadership-heading"
          overline="The school"
          title="Leadership and registration"
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            maxWidth: 900,
          }}
        >
          <Card title="Head teacher">
            <DetailText detail={about.leadership.headTeacher} sx={{ color: "text.secondary" }} />
          </Card>

          <Card title="Registration">
            <DetailText detail={about.registration} sx={{ color: "text.secondary" }} />
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
