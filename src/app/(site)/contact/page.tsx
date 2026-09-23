import type { Metadata } from "next";
import { Box, Button, Typography } from "@mui/material";

import DetailText from "@/components/site/DetailText";
import PageHero from "@/components/site/PageHero";
import Section, { SectionHeading } from "@/components/site/Section";
import { contact, isKnown, school, social } from "@/content/site";
import { pageMetadata } from "@/lib/site/metadata";
import { portalHref } from "@/lib/site/host";
import { BRAND_GOLD, BRAND_GREEN_DARK, ON_GREEN } from "@/theme";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Contact ${school.name} in ${school.town}, ${school.region}, Ghana — the school office, our campuses, and how enrolled families sign in.`,
  path: "/contact",
});

/**
 * The Contact page.
 *
 * A `tel:` or `mailto:` link is only rendered once the value is real. A link
 * built from a placeholder would be worse than no link: it looks actionable,
 * and a parent tapping it gets a dial tone to nowhere. `isKnown` gates each one
 * individually, so the page improves the moment any single detail arrives.
 *
 * There is no contact form. A form with nothing behind it silently swallows
 * what a parent writes — so the page offers only routes that genuinely work,
 * and the form is recorded in `PLACEHOLDERS.md` as work that needs a mail
 * service before it can be built honestly.
 */
export default function ContactPage() {
  const hasPhone = isKnown(contact.phone);
  const hasEmail = isKnown(contact.email);
  const hasWhatsApp = isKnown(social.whatsapp);
  const anythingReachable = hasPhone || hasEmail || hasWhatsApp;

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Address",
      value: (
        <>
          <DetailText detail={contact.addressLine1} />
          <br />
          {contact.town}, {contact.region}
          <br />
          {contact.country}
        </>
      ),
    },
    {
      label: "Telephone",
      value: hasPhone ? (
        <Box
          component="a"
          href={`tel:${contact.phone.value.replace(/\s+/g, "")}`}
          sx={{ color: "primary.main", fontWeight: 600 }}
        >
          {contact.phone.value}
        </Box>
      ) : (
        <DetailText detail={contact.phone} />
      ),
    },
    {
      label: "Email",
      value: hasEmail ? (
        <Box
          component="a"
          href={`mailto:${contact.email.value}`}
          sx={{ color: "primary.main", fontWeight: 600, wordBreak: "break-word" }}
        >
          {contact.email.value}
        </Box>
      ) : (
        <DetailText detail={contact.email} />
      ),
    },
    {
      label: "Office hours",
      value: <DetailText detail={contact.officeHours} />,
    },
  ];

  return (
    <>
      <PageHero
        overline="Contact"
        title="Contact the school"
        lead="Speak to the school office about admissions, fees, term dates, or anything concerning your child."
      />

      <Section tone="default" labelledBy="contact-details-heading" maxWidth="md">
        <SectionHeading
          id="contact-details-heading"
          overline="The office"
          title="How to reach us"
        />

        {!anythingReachable ? (
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderLeft: `4px solid ${BRAND_GOLD}`,
              borderRadius: "14px",
              backgroundColor: "background.paper",
              p: { xs: 2.5, md: 3 },
              mb: 4,
            }}
          >
            <Typography sx={{ fontWeight: 600, color: "secondary.main", mb: 0.5 }}>
              Our telephone and email details are being confirmed
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              The school&rsquo;s contact details are not yet published on this website. In the
              meantime, please visit the school office in {school.town} in person — you will find us
              at our {school.campuses.join(" and ")} campuses.
            </Typography>
          </Box>
        ) : null}

        <Box component="dl" sx={{ m: 0 }}>
          {rows.map((row, index) => (
            <Box
              key={row.label}
              sx={{
                display: "grid",
                gap: { xs: 0.5, sm: 3 },
                gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" },
                py: 2.5,
                borderTop: index === 0 ? "1px solid" : "none",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box component="dt">
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  {row.label}
                </Typography>
              </Box>
              <Box component="dd" sx={{ m: 0, color: "text.primary" }}>
                {row.value}
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography
            component="h3"
            variant="h6"
            sx={{ color: "secondary.main", mb: 1, fontSize: "1.0625rem" }}
          >
            Finding us
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            The school is in {school.town}, in Ghana&rsquo;s {school.region}. Our exact digital
            address (Ghana Post GPS) is being confirmed.{" "}
            <Box
              component="a"
              href="https://www.google.com/maps/search/?api=1&query=Lucky+Star+Academy+Yendi"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "primary.main", fontWeight: 600 }}
            >
              Search for us on Google Maps
            </Box>
            .
          </Typography>
        </Box>
      </Section>

      {/* Families ------------------------------------------------------- */}
      <Section tone="green" labelledBy="contact-portal-heading">
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
              id="contact-portal-heading"
              overline="For families"
              title="Already part of the school?"
              lead="Pupils and staff sign in to the school portal to see attendance, marks, notices and timetables."
              onGreen
            />

            <Typography variant="body2" sx={{ color: ON_GREEN, opacity: 0.85, mb: 3 }}>
              The portal is for pupils, teachers and the school office. If you have forgotten your
              sign-in details, please contact the school office.
            </Typography>

            <Button
              href={portalHref("/login")}
              component="a"
              variant="contained"
              sx={{
                backgroundColor: BRAND_GOLD,
                color: BRAND_GREEN_DARK,
                "&:hover": { backgroundColor: "#E0A800" },
              }}
            >
              Portal login
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
              Social media
            </Typography>
            <Typography variant="body2" sx={{ color: ON_GREEN, opacity: 0.9 }}>
              <DetailText detail={social.facebook} />
            </Typography>
          </Box>
        </Box>
      </Section>
    </>
  );
}
