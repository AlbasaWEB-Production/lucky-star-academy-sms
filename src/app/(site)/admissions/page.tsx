import type { Metadata } from "next";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import CTABand from "@/components/site/CTABand";
import Card from "@/components/site/Card";
import DetailText, { PendingBlock } from "@/components/site/DetailText";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/site/Reveal";
import Section, { SectionHeading } from "@/components/site/Section";
import { admissions, school } from "@/content/site";
import { pageMetadata } from "@/lib/site/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Admissions",
  description: `How to apply to ${school.name}, a ${school.levels} school in ${school.town}, ${school.region}, Ghana. Requirements, fees and how to contact the school office.`,
  path: "/admissions",
});

/**
 * The Admissions page.
 *
 * The four steps are the shape of any school's admission process and are safe
 * to publish; the detail inside each one — who to ask for, which documents, by
 * when — is the school's to state, and is held open rather than guessed at.
 *
 * There is deliberately **no application form**. A form that posts nowhere is a
 * fake affordance: a parent would fill it in and believe they had applied. The
 * page says what to do instead, and `PLACEHOLDERS.md` records the form as a
 * follow-up that needs a mail service behind it before it can be built.
 */
export default function AdmissionsPage() {
  return (
    <>
      <PageHero overline="Admissions" title={admissions.heading} lead={admissions.lead} />

      {/* How to apply --------------------------------------------------- */}
      <Section tone="default" labelledBy="admissions-steps-heading">
        <SectionHeading
          id="admissions-steps-heading"
          overline="How to apply"
          title="Four steps to a place"
          lead="Every family follows the same route. The school office will guide you through it."
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          {admissions.steps.map((step, index) => (
            <Reveal key={step.title} delayMs={index * 80}>
              <Card title={step.title} index={index + 1}>
                <Box sx={{ mt: 1 }}>
                  <DetailText detail={step.body} sx={{ color: "text.secondary" }} />
                </Box>
              </Card>
            </Reveal>
          ))}
        </Box>
      </Section>

      {/* Documents and fees -------------------------------------------- */}
      <Section tone="paper" labelledBy="admissions-requirements-heading">
        <SectionHeading
          id="admissions-requirements-heading"
          overline="Before you come"
          title={admissions.requirements.heading}
          lead="Bring these to the school office when you apply."
        />

        <Box
          sx={{
            display: "grid",
            gap: 4,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            alignItems: "start",
          }}
        >
          <PendingBlock detail={admissions.requirements.items} />

          <Box>
            <Typography
              component="h3"
              variant="h6"
              sx={{ color: "secondary.main", mb: 2, fontSize: "1.0625rem" }}
            >
              {admissions.fees.heading}
            </Typography>
            <PendingBlock
              detail={admissions.fees.body}
              fallback={admissions.fees.bodyFallback}
              sx={{ color: "text.secondary" }}
            />
          </Box>
        </Box>
      </Section>

      {/* FAQs ----------------------------------------------------------- */}
      <Section tone="default" labelledBy="admissions-faq-heading" maxWidth="md">
        <SectionHeading
          id="admissions-faq-heading"
          overline="Questions"
          title="Frequently asked"
        />

        <Box>
          {admissions.faqs.map((faq, index) => (
            <Accordion
              key={faq.question}
              defaultExpanded={index === 0}
              disableGutters
              elevation={0}
              sx={{
                backgroundColor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "14px !important",
                mb: 1.5,
                "&::before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                id={`faq-${index}-header`}
                aria-controls={`faq-${index}-panel`}
              >
                <Typography sx={{ fontWeight: 600, color: "secondary.main" }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Section>

      <CTABand
        heading="Ready to apply?"
        lead="Call into the school office, or visit us in Yendi. We will walk you through everything your child needs."
        primaryLabel="Contact the office"
        primaryHref="/contact"
        secondaryLabel="See the gallery"
        secondaryHref="/gallery"
      />
    </>
  );
}
