import { Box, Container, Typography } from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";

import Link from "@/components/NextLink";
import DetailText from "@/components/site/DetailText";
import SchoolLogo from "@/components/ui/SchoolLogo";
import { campuses, contact, isKnown, newsletter, school, TAGLINE } from "@/content/site";
import { portalHref } from "@/lib/site/host";
import { SITE_NAV } from "@/lib/site/routes";
import { BRAND_GOLD, BRAND_GREEN_DARK, DISPLAY_FONT, ON_GREEN, TEXT_FONT } from "@/theme";

/**
 * The site footer — the reference layout's five columns.
 *
 * Identity, the site's pages, the things families actually look for, how to
 * reach the office, and the newsletter column.
 *
 * **The newsletter column has no form.** The reference ships a subscribe field
 * that runs `reportValidity()` and then, in its own script, prints that the
 * address was not submitted. That is an unwired affordance: it takes something
 * from a parent and gives nothing back while looking like it worked. This column
 * says what it is waiting for instead, and `PLACEHOLDERS.md` records the service
 * that has to exist before a real form can be built.
 *
 * The credit line is unchanged and word for word from the convention in
 * `PAGE-CONVENTIONS.md`: one third-party reference, the AlbasaWEB credit, and
 * no other badge.
 *
 * Server-safe: no state, no hooks.
 */

const headingSx = {
  fontFamily: TEXT_FONT,
  fontSize: "0.6875rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
  color: "#FFFFFF",
  mb: 1.75,
} as const;

const bodySx = {
  color: ON_GREEN,
  fontSize: "0.875rem",
  lineHeight: 1.75,
  opacity: 0.9,
} as const;

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const hasEmail = isKnown(contact.email);

  return (
    <Box
      component="footer"
      className="grain"
      sx={{
        position: "relative",
        backgroundColor: BRAND_GREEN_DARK,
        pt: { xs: 7, md: 8 },
        pb: { xs: 3, md: 3.5 },
        borderTop: "1px solid rgba(244, 241, 232, 0.16)",
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 5, sm: 4, md: 4 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1.4fr 0.8fr 0.9fr 1.1fr 1.1fr",
            },
          }}
        >
          {/* Identity */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <SchoolLogo decorative sizes="52px" sx={{ height: 44 }} />
              <Typography
                sx={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 600,
                  fontSize: "1.125rem",
                  color: "#FFFFFF",
                  lineHeight: 1.15,
                }}
              >
                {school.name}
              </Typography>
            </Box>

            <Typography sx={{ ...bodySx, maxWidth: 300 }}>{TAGLINE}</Typography>

            <Typography
              sx={{
                ...bodySx,
                mt: 2,
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: BRAND_GOLD,
              }}
            >
              {school.motto}
            </Typography>
          </Box>

          {/* Explore */}
          <Box component="nav" aria-label="Footer">
            <Typography component="h2" sx={headingSx}>
              Explore
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {SITE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    color: ON_GREEN,
                    fontFamily: TEXT_FONT,
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    opacity: 0.9,
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </Box>
          </Box>

          {/* For families */}
          <Box>
            <Typography component="h2" sx={headingSx}>
              For families
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              <Link
                href={portalHref("/login")}
                style={{
                  color: ON_GREEN,
                  fontFamily: TEXT_FONT,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  opacity: 0.9,
                }}
              >
                Portal login
              </Link>
              <Link
                href="/admissions"
                style={{
                  color: ON_GREEN,
                  fontFamily: TEXT_FONT,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  opacity: 0.9,
                }}
              >
                How to apply
              </Link>
              <Link
                href="/academics"
                style={{
                  color: ON_GREEN,
                  fontFamily: TEXT_FONT,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  opacity: 0.9,
                }}
              >
                Term dates
              </Link>
              <Link
                href="/gallery"
                style={{
                  color: ON_GREEN,
                  fontFamily: TEXT_FONT,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                  opacity: 0.9,
                }}
              >
                Photographs
              </Link>
            </Box>
          </Box>

          {/* Contact */}
          <Box>
            <Typography component="h2" sx={headingSx}>
              Get in touch
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {campuses.map((campus) => (
                <Box
                  key={campus.name}
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}
                >
                  <LocationOnOutlinedIcon sx={{ fontSize: 17, color: BRAND_GOLD, mt: 0.25 }} />
                  <Typography sx={{ ...bodySx, fontSize: "0.8125rem" }} component="div">
                    <Box component="span" sx={{ fontWeight: 600, color: "#FFFFFF" }}>
                      {campus.name} Campus
                    </Box>
                    <br />
                    {campus.address}
                  </Typography>
                </Box>
              ))}

              {[contact.phone, contact.phoneAlt].map((phone) =>
                isKnown(phone) ? (
                  <Box
                    key={phone.value}
                    component="a"
                    href={`tel:${phone.value.replace(/\s+/g, "")}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      color: ON_GREEN,
                      fontSize: "0.8125rem",
                      textDecoration: "none",
                      "&:hover": { color: BRAND_GOLD },
                    }}
                  >
                    <PhoneOutlinedIcon sx={{ fontSize: 17, color: BRAND_GOLD }} />
                    {phone.value}
                  </Box>
                ) : null,
              )}

              {hasEmail ? (
                <Box
                  component="a"
                  href={`mailto:${contact.email.value}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    color: ON_GREEN,
                    fontSize: "0.8125rem",
                    textDecoration: "none",
                    wordBreak: "break-all",
                    "&:hover": { color: BRAND_GOLD },
                  }}
                >
                  <MailOutlinedIcon sx={{ fontSize: 17, color: BRAND_GOLD, flexShrink: 0 }} />
                  {contact.email.value}
                </Box>
              ) : null}
            </Box>
          </Box>

          {/* Stay connected */}
          <Box>
            <Typography component="h2" sx={headingSx}>
              {newsletter.heading}
            </Typography>
            <Typography sx={{ ...bodySx, fontSize: "0.8125rem", mb: 1.5 }}>
              {newsletter.body}
            </Typography>
            <Typography variant="caption" sx={{ color: ON_GREEN, opacity: 0.75, display: "block" }}>
              <DetailText detail={newsletter.service} />
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Link
                href="/contact"
                style={{
                  color: BRAND_GOLD,
                  fontFamily: TEXT_FONT,
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Contact the office &rarr;
              </Link>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: { xs: 5, md: 6 },
            pt: 2.5,
            borderTop: "1px solid rgba(244, 241, 232, 0.16)",
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="caption" sx={{ color: ON_GREEN, opacity: 0.85 }}>
            © {year} {school.name} &middot; Designed &amp; Developed by{" "}
            <Link
              href="https://albasaweb.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", fontWeight: 600 }}
            >
              AlbasaWEB
            </Link>
          </Typography>

          <Box
            component="a"
            href="#main-content"
            sx={{
              color: ON_GREEN,
              fontSize: "0.75rem",
              opacity: 0.85,
              textDecoration: "none",
              "&:hover": { color: BRAND_GOLD },
            }}
          >
            Back to top &uarr;
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
