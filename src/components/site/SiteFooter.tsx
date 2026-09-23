import { Box, Container, Typography } from "@mui/material";

import Link from "@/components/NextLink";
import DetailText from "@/components/site/DetailText";
import SchoolLogo from "@/components/ui/SchoolLogo";
import { contact, school, TAGLINE } from "@/content/site";
import { portalHref } from "@/lib/site/host";
import { SITE_NAV } from "@/lib/site/routes";
import { BRAND_GOLD, BRAND_GREEN_DARK, DISPLAY_FONT, ON_GREEN, TEXT_FONT } from "@/theme";

/**
 * The public website's footer — the deep-green closing band on every page.
 *
 * It carries the three things a school footer is actually used for: how to
 * reach the office, how to get around the site, and how families sign in to the
 * portal. The AlbasaWEB credit is the same sentence, word for word, that
 * `@/components/ui/SiteFooter` renders inside the app — the convention in
 * `PAGE-CONVENTIONS.md` is a single credit line and no other third-party badge,
 * and that holds here too.
 *
 * Server-safe: no state, no hooks.
 */

const headingSx = {
  fontFamily: DISPLAY_FONT,
  fontWeight: 600,
  fontSize: "0.9375rem",
  color: "#FFFFFF",
  mb: 1.5,
} as const;

const bodySx = {
  color: ON_GREEN,
  fontSize: "0.9375rem",
  lineHeight: 1.7,
  opacity: 0.92,
} as const;

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      className="grain"
      sx={{
        position: "relative",
        backgroundColor: BRAND_GREEN_DARK,
        pt: { xs: 7, md: 9 },
        pb: { xs: 4, md: 5 },
        borderTop: "1px solid rgba(244, 241, 232, 0.16)",
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 5, md: 4 },
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.4fr 1fr 1.2fr" },
          }}
        >
          {/* Identity */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <SchoolLogo decorative sizes="56px" sx={{ height: 46 }} />
              <Typography
                sx={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 600,
                  fontSize: "1.125rem",
                  color: "#FFFFFF",
                  lineHeight: 1.2,
                }}
              >
                {school.name}
              </Typography>
            </Box>

            <Typography sx={{ ...bodySx, maxWidth: 340 }}>{TAGLINE}</Typography>

            <Typography sx={{ ...bodySx, mt: 1.5, fontWeight: 600 }}>
              &ldquo;{school.motto}&rdquo;
            </Typography>

            <Typography sx={{ ...bodySx, mt: 0.5, opacity: 0.75, fontSize: "0.875rem" }}>
              Established {school.founded}
            </Typography>
          </Box>

          {/* Site links */}
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
                    fontSize: "0.9375rem",
                    textDecoration: "none",
                    opacity: 0.92,
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </Box>
          </Box>

          {/* Contact */}
          <Box>
            <Typography component="h2" sx={headingSx}>
              Contact the office
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={bodySx} component="div">
                <DetailText detail={contact.addressLine1} component="span" />
                <br />
                {contact.town}, {contact.region}
                <br />
                {contact.country}
              </Typography>

              <Typography sx={bodySx} component="div">
                <DetailText detail={contact.phone} component="span" />
              </Typography>

              <Typography sx={bodySx} component="div">
                <DetailText detail={contact.email} component="span" />
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Link
                href={portalHref("/login")}
                style={{
                  color: BRAND_GOLD,
                  fontFamily: TEXT_FONT,
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Portal login &rarr;
              </Link>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: { xs: 6, md: 8 },
            pt: 3,
            borderTop: "1px solid rgba(244, 241, 232, 0.16)",
            textAlign: "center",
          }}
        >
          <Typography variant="caption" sx={{ color: ON_GREEN, opacity: 0.88 }}>
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
        </Box>
      </Container>
    </Box>
  );
}
