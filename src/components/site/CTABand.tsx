import { Box, Button, Container, Typography } from "@mui/material";

import Link from "@/components/NextLink";
import { BRAND_GOLD, BRAND_GREEN_DARK, HERO_GREEN, ON_GREEN } from "@/theme";

/**
 * The closing band on the pages that should end with one clear next step.
 *
 * Two actions only — apply, or ask a question — because a footer-adjacent band
 * offering four choices is a band nobody acts on.
 */
export default function CTABand({
  heading = "Ready to join Lucky Star Academy?",
  lead = "Families are welcome to visit the school, meet the teachers and see a class before deciding.",
  primaryLabel = "Admissions",
  primaryHref = "/admissions",
  secondaryLabel = "Contact the office",
  secondaryHref = "/contact",
}: {
  heading?: string;
  lead?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <Box
      component="section"
      className="grain"
      sx={{ position: "relative", backgroundColor: HERO_GREEN, py: { xs: 8, md: 10 } }}
    >
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <Typography
          variant="h2"
          sx={{ color: "#FFFFFF", mb: 2, fontSize: { xs: "1.75rem", md: "2.25rem" } }}
        >
          {heading}
        </Typography>

        <Typography
          variant="body1"
          sx={{ color: ON_GREEN, mb: 4, maxWidth: 620, mx: "auto" }}
        >
          {lead}
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            component={Link}
            href={primaryHref}
            variant="contained"
            sx={{
              backgroundColor: BRAND_GOLD,
              color: BRAND_GREEN_DARK,
              "&:hover": { backgroundColor: "#E0A800" },
            }}
          >
            {primaryLabel}
          </Button>

          <Button
            component={Link}
            href={secondaryHref}
            variant="outlined"
            sx={{
              color: "#FFFFFF",
              borderColor: "rgba(244, 241, 232, 0.5)",
              "&:hover": {
                borderColor: "#FFFFFF",
                backgroundColor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            {secondaryLabel}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
