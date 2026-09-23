import type { Metadata } from "next";
import { Box, Typography } from "@mui/material";

import CTABand from "@/components/site/CTABand";
import Card from "@/components/site/Card";
import { PendingBlock } from "@/components/site/DetailText";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import Section, { SectionHeading } from "@/components/site/Section";
import { academics, school } from "@/content/site";
import { pageMetadata } from "@/lib/site/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Academics",
  description: `The ${school.levels} course at ${school.name} in ${school.town}, Ghana — what is taught, how progress is measured, and the school calendar.`,
  path: "/academics",
});

/**
 * The Academics page.
 *
 * The school's structure — two stages of primary, three terms — is real, and
 * the paragraphs that describe teaching and assessment are held open for the
 * school to write. The single thing this page can assert on its own authority
 * is that attendance and examination marks are recorded for every pupil, which
 * is true in the school's own data.
 */
export default function AcademicsPage() {
  return (
    <>
      <PageHero overline="Academics" title={academics.heading} lead={academics.lead} />

      {/* The two stages ------------------------------------------------- */}
      <Section tone="default" labelledBy="academics-stages-heading">
        <SectionHeading
          id="academics-stages-heading"
          overline="Our classes"
          title="Two stages of primary school"
          lead={`We teach ${school.levels}, from a child's first year through to the year they leave for junior high school.`}
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {academics.stages.map((stage, index) => (
            <Reveal key={stage.name} delayMs={index * 90}>
              <Card title={stage.name} body={stage.classes}>
                <Box sx={{ mt: 2 }}>
                  <PendingBlock detail={stage.body} />
                </Box>
              </Card>
            </Reveal>
          ))}
        </Box>
      </Section>

      {/* Subjects ------------------------------------------------------- */}
      <Section tone="paper" labelledBy="academics-subjects-heading">
        <SectionHeading
          id="academics-subjects-heading"
          overline="Curriculum"
          title={academics.subjects.heading}
          lead="The subjects taught at each level, following the Ghana Education Service primary curriculum."
        />
        <PendingBlock detail={academics.subjects.items} />
      </Section>

      {/* Assessment ----------------------------------------------------- */}
      <Section tone="default" labelledBy="academics-assessment-heading">
        <SectionHeading
          id="academics-assessment-heading"
          overline="Progress"
          title={academics.assessment.heading}
        />

        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            alignItems: "start",
          }}
        >
          <Reveal>
            <PendingBlock
              detail={academics.assessment.body}
              fallback={academics.assessment.bodyFallback}
              sx={{ color: "text.secondary", lineHeight: 1.75 }}
            />
          </Reveal>

          <Reveal delayMs={100}>
            <Box
              sx={{
                backgroundColor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "20px",
                p: { xs: 3, md: 3.5 },
              }}
            >
              <Typography
                component="h3"
                variant="h6"
                sx={{ color: "secondary.main", mb: 2, fontSize: "1.0625rem" }}
              >
                {academics.schoolDay.heading}
              </Typography>
              <PendingBlock detail={academics.schoolDay.items} />
            </Box>
          </Reveal>
        </Box>
      </Section>

      {/* Calendar ------------------------------------------------------- */}
      <Section tone="paper" labelledBy="academics-calendar-heading">
        <SectionHeading
          id="academics-calendar-heading"
          overline="The school year"
          title={academics.calendar.heading}
          lead={academics.calendar.structure}
        />
        <PendingBlock detail={academics.calendar.items} />
      </Section>

      <CTABand
        heading="Questions about the curriculum?"
        lead="The school office can explain what your child will be taught, and how their progress will be reported to you."
        primaryLabel="Admissions"
        primaryHref="/admissions"
        secondaryLabel="Contact the office"
        secondaryHref="/contact"
      />
    </>
  );
}
