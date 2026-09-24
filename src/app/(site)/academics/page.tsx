import type { Metadata } from "next";
import { Box, Typography } from "@mui/material";

import CTABand from "@/components/site/CTABand";
import { PendingBlock } from "@/components/site/DetailText";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import Section, { SectionHeading } from "@/components/site/Section";
import { academics, programmes, school, values } from "@/content/site";
import { pageMetadata } from "@/lib/site/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Academics",
  description: `${school.name} in ${school.town}, Ghana teaches ${school.levels}, with Islamic Studies and Digital Studies alongside the school curriculum.`,
  path: "/academics",
});

/**
 * The Academics page.
 *
 * The school supplied its four programmes and every class and subject inside
 * them, so this page now shows **real course lists** rather than placeholders —
 * only the paragraphs describing how each programme is taught are still open.
 *
 * The programmes come from the same `programmes` array the home page's card row
 * reads, so the two cannot disagree about what the school teaches.
 */
export default function AcademicsPage() {
  return (
    <>
      <PageHero overline="Academics" title={academics.heading} lead={academics.lead} />

      {/* The programmes -------------------------------------------------- */}
      <Section tone="default" labelledBy="academics-programmes-heading">
        <SectionHeading
          id="academics-programmes-heading"
          overline="Our programmes"
          title="Four programmes, one school"
          lead="Preschool and primary, with Islamic Studies and Digital Studies running alongside the school curriculum."
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {programmes.map((programme, index) => (
            <Reveal key={programme.key} delayMs={index * 90}>
              <Box
                sx={{
                  height: "100%",
                  backgroundColor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "20px",
                  p: { xs: 3, md: 3.5 },
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="overline" sx={{ color: "#AF7C12", fontWeight: 700 }}>
                  {programme.meta}
                </Typography>

                <Typography
                  component="h3"
                  variant="h6"
                  sx={{ color: "secondary.main", mt: 0.5, mb: 1, fontSize: "1.125rem" }}
                >
                  {programme.name}
                </Typography>

                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
                  {programme.summary}
                </Typography>

                {/* The classes or subjects inside the programme. Every entry was
                    supplied by the school. */}
                <Box
                  component="ul"
                  sx={{
                    listStyle: "none",
                    m: 0,
                    p: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 3,
                  }}
                >
                  {programme.courses.map((course) => (
                    <Box
                      component="li"
                      key={course}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "999px",
                        backgroundColor: "rgba(20, 123, 69, 0.09)",
                        color: "secondary.main",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                      }}
                    >
                      {course}
                    </Box>
                  ))}
                </Box>

                <Box sx={{ mt: "auto" }}>
                  <PendingBlock detail={programme.body} />
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Section>

      {/* Values ---------------------------------------------------------- */}
      <Section tone="paper" labelledBy="academics-values-heading">
        <SectionHeading
          id="academics-values-heading"
          overline="What we teach by"
          title="Our five values"
          lead={`The school's values are ${values.slice(0, -1).join(", ").toLowerCase()} and ${values[values.length - 1].toLowerCase()}.`}
        />

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
                backgroundColor: "background.paper",
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
                component="h3"
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
      </Section>

      {/* Subjects ------------------------------------------------------- */}
      <Section tone="default" labelledBy="academics-subjects-heading">
        <SectionHeading
          id="academics-subjects-heading"
          overline="Curriculum"
          title={academics.subjects.heading}
          lead="The subjects taught in the primary classes, following the Ghana Education Service curriculum."
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
