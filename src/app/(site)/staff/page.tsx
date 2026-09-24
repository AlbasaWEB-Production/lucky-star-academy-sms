import type { Metadata } from "next";
import { Box, Button, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import CTABand from "@/components/site/CTABand";
import DetailText, { PendingBlock } from "@/components/site/DetailText";
import PageHero from "@/components/site/PageHero";
import PhotoFrame, { STOCK_PLACEHOLDER } from "@/components/site/PhotoFrame";
import Reveal from "@/components/site/Reveal";
import Section, { SectionHeading } from "@/components/site/Section";
import Link from "@/components/NextLink";
import { school, staff } from "@/content/site";
import { pageMetadata } from "@/lib/site/metadata";
import { BRAND_GOLD, BRAND_GREEN, BRAND_GREEN_DARK, ON_GREEN } from "@/theme";

export const metadata: Metadata = pageMetadata({
  title: "Staff",
  description: `The head teacher and school office of ${school.name}, a preschool and primary school in ${school.town}, ${school.region}, Ghana.`,
  path: "/staff",
});

/**
 * The Staff page.
 *
 * The school asked for this page and supplied one name — the Admin and Finance
 * Officer. The head teacher's name was marked with an ❌, so that card is a
 * visible placeholder rather than an omission: a staff page that silently
 * listed one person would look like a decision the school had made, and the
 * school has not made it.
 *
 * The photograph is a labelled stock stand-in, like the rest of the site's
 * images. `PLACEHOLDERS.md` records that it must be replaced.
 */
export default function StaffPage() {
  const [headTeacher, ...rest] = staff.members;

  return (
    <>
      <PageHero overline="Our staff" title={staff.heading} lead={staff.lead} />

      <Section tone="default" labelledBy="staff-list-heading">
        <SectionHeading
          id="staff-list-heading"
          overline="Who we are"
          title="The people who run the school"
          lead="Families are welcome to ask for any of them by name at the school office."
        />

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, minmax(0, 1fr))" },
            alignItems: "start",
          }}
        >
          {/* The head teacher. Named as soon as the school supplies the name;
              until then the card is a placeholder, not a blank. */}
          {headTeacher ? (
            <Reveal>
              <Box
                sx={{
                  height: "100%",
                  backgroundColor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  // Dashed while the name is a placeholder, so an unfinished
                  // card reads as unfinished rather than as a styling choice.
                  borderStyle: headTeacher.name.pending ? "dashed" : "solid",
                  borderRadius: "20px",
                  p: 3,
                }}
              >
                <Box
                  aria-hidden
                  sx={{ width: 24, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999, mb: 2 }}
                />

                <Typography
                  component="h3"
                  variant="h6"
                  sx={{ color: "secondary.main", mb: 0.5, fontSize: "1.125rem" }}
                >
                  {headTeacher.role}
                </Typography>

                <Typography variant="body1" sx={{ color: "text.primary", fontWeight: 600 }}>
                  <DetailText detail={headTeacher.name} />
                </Typography>
              </Box>
            </Reveal>
          ) : null}

          {rest.map((member, index) => (
            <Reveal key={member.key} delayMs={(index + 1) * 80}>
              <Box
                sx={{
                  height: "100%",
                  backgroundColor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "20px",
                  p: 3,
                }}
              >
                <Box
                  aria-hidden
                  sx={{ width: 24, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999, mb: 2 }}
                />

                <Typography
                  component="h3"
                  variant="h6"
                  sx={{ color: "secondary.main", mb: 0.5, fontSize: "1.125rem" }}
                >
                  {member.role}
                </Typography>

                <Typography variant="body1" sx={{ color: "text.primary", fontWeight: 600 }}>
                  <DetailText detail={member.name} />
                </Typography>
              </Box>
            </Reveal>
          ))}

          {/* A photograph slot, so the page is not three lines of text. */}
          <Reveal delayMs={160}>
            <PhotoFrame
              src={STOCK_PLACEHOLDER.src}
              alt=""
              objectPosition={STOCK_PLACEHOLDER.crops.window}
              aspectRatio="4 / 3"
              sizes="(max-width: 599px) 100vw, (max-width: 1199px) 50vw, 400px"
              radius="20px"
            />
          </Reveal>
        </Box>

        <Box sx={{ mt: 4, maxWidth: 720 }}>
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            Still to come
          </Typography>
          <Box sx={{ mt: 1 }}>
            <PendingBlock detail={staff.more} />
          </Box>
        </Box>
      </Section>

      {/* The office ------------------------------------------------------ */}
      <Section tone="green" labelledBy="staff-office-heading">
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" },
            alignItems: "center",
          }}
        >
          <Box>
            <SectionHeading
              id="staff-office-heading"
              overline="The school office"
              title="Need to speak to someone?"
              lead="The office handles admissions, fees, term dates and anything concerning your child."
              onGreen
            />

            <Button
              component={Link}
              href="/contact"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: BRAND_GOLD,
                color: BRAND_GREEN_DARK,
                "&:hover": { backgroundColor: "#E0A800" },
              }}
            >
              Contact the office
            </Button>
          </Box>

          <Box
            sx={{
              border: "1px solid rgba(244, 241, 232, 0.28)",
              borderRadius: "20px",
              p: 3,
            }}
          >
            <Typography
              component="h3"
              variant="h6"
              sx={{ color: "#FFFFFF", mb: 1.5, fontSize: "1.0625rem" }}
            >
              Enrolled already?
            </Typography>
            <Typography variant="body2" sx={{ color: ON_GREEN, opacity: 0.9, mb: 2 }}>
              Pupils and staff sign in to the school portal for attendance, marks and notices.
            </Typography>
            <Link
              href="/contact"
              style={{ color: BRAND_GOLD, fontWeight: 600, textDecoration: "underline" }}
            >
              Portal login details &rarr;
            </Link>
          </Box>
        </Box>
      </Section>

      <CTABand
        heading="Come and meet us"
        lead="Families are always welcome to visit the school, meet the teachers and look at a class before deciding."
        primaryLabel="Admissions"
        primaryHref="/admissions"
        secondaryLabel="Contact the office"
        secondaryHref="/contact"
      />
    </>
  );
}
