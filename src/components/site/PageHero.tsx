import { Box, Container, Typography } from "@mui/material";

import { BRAND_GOLD, HERO_GREEN, ON_GREEN } from "@/theme";

/**
 * The opening band on every public page except the home page.
 *
 * The header is sticky rather than fixed, so this band already begins below it
 * and needs no clearance padding of its own — it just needs enough room above
 * the title to breathe.
 */
export default function PageHero({
  overline,
  title,
  lead,
}: {
  overline?: string;
  title: string;
  lead?: string;
}) {
  return (
    <Box
      component="section"
      className="grain"
      sx={{
        position: "relative",
        backgroundColor: HERO_GREEN,
        pt: { xs: 7, sm: 8, md: 10 },
        pb: { xs: 7, sm: 8, md: 10 },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        {overline ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box
              aria-hidden
              sx={{ width: 28, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
            />
            <Typography variant="overline" sx={{ color: BRAND_GOLD }}>
              {overline}
            </Typography>
          </Box>
        ) : null}

        <Typography
          variant="h1"
          sx={{
            color: "#FFFFFF",
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            maxWidth: 820,
          }}
        >
          {title}
        </Typography>

        {lead ? (
          <Typography
            variant="body1"
            sx={{ color: ON_GREEN, mt: 2.5, maxWidth: 680, fontSize: "1.0625rem" }}
          >
            {lead}
          </Typography>
        ) : null}
      </Container>
    </Box>
  );
}
