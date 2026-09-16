import Link from "@/components/NextLink";
import { Box, Container, Typography } from "@mui/material";

import { BRAND_GOLD, BRAND_GREEN_DARK, ON_GREEN } from "@/theme";

/**
 * Product-wide footer credit.
 *
 * Server-safe (no state). The only third-party reference on the page is the
 * AlbasaWEB credit — no other badge or link. The current year is computed at
 * render, and the school name is passed in by the caller so the signed-in shell
 * can show its own school.
 *
 * `variant="landing"` is the homepage's deep-green footer: same credit, word for
 * word, plus the school line and the quiet school-registration link that the
 * landing page demotes its registration CTA to. Every other surface (login, auth
 * shell, app shell) keeps the plain treatment, which is why this is opt-in
 * rather than the default.
 */
export default function SiteFooter({
  schoolName = "Lucky Star Academy",
  variant = "plain",
}: {
  schoolName?: string;
  variant?: "plain" | "landing";
}) {
  const year = new Date().getFullYear();

  if (variant === "landing") {
    return (
      <Box
        component="footer"
        className="grain"
        sx={{
          position: "relative",
          // Deeper than the "this school" band it sits under, so no two
          // adjacent sections share a ground.
          backgroundColor: BRAND_GREEN_DARK,
          py: { xs: 5, md: 6 },
          borderTop: "1px solid rgba(244, 241, 232, 0.16)",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ position: "relative", zIndex: 1, textAlign: "center" }}
        >
          <Typography variant="body2" sx={{ color: ON_GREEN, mb: 1.5 }}>
            {schoolName}, Yendi &middot; Primary 1&ndash;6
          </Typography>

          <Typography variant="caption" sx={{ color: ON_GREEN, opacity: 0.88 }}>
            © {year} {schoolName} &middot; Designed &amp; Developed by{" "}
            <Link
              href="https://albasaweb.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", fontWeight: 600 }}
            >
              AlbasaWEB
            </Link>
          </Typography>

          <Typography variant="caption" component="div" sx={{ mt: 2 }}>
            <Link
              href="/register/school"
              style={{
                color: ON_GREEN,
                textDecorationColor: BRAND_GOLD,
                textUnderlineOffset: 3,
              }}
            >
              Create a school account
            </Link>
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      component="footer"
      sx={{ py: 3, px: 2, textAlign: "center", borderTop: "1px solid", borderColor: "divider" }}
    >
      <Typography variant="caption" color="text.secondary">
        © {year} {schoolName} &middot; Designed &amp; Developed by{" "}
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
  );
}
