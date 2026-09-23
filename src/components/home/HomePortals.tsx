import { Box, Container, Typography } from "@mui/material";

import PortalCard from "@/components/portals/PortalCard";
import { PORTAL_CARDS } from "@/components/portals/portals";
import Reveal from "@/components/home/Reveal";
import { BRAND_GOLD, BRAND_GREEN_DARK, PAGE_BG } from "@/theme";

/**
 * The portals band: five doors on the light ground.
 *
 * The cards themselves live in `@/components/portals/PortalCard`, shared with
 * the sign-in chooser at `/login`. This component owns only the band — its
 * ground, its heading and the reveal animation — so the two pages cannot drift
 * into two different card designs again, which is exactly what had happened:
 * `/login` was still drawing the pre-redesign card.
 *
 * Three across from `md`, so the five cards flow as 3 + 2. Deliberately not
 * five narrow columns: each card carries a description sentence and would wrap
 * to an unreadable column.
 */
export default function HomePortals() {
  return (
    <Box
      component="section"
      id="portals"
      aria-labelledby="home-portals-heading"
      sx={{
        position: "relative",
        zIndex: 1, // below the hero, so the hero's gold seal overlaps this band
        backgroundColor: PAGE_BG,
        py: { xs: 9, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        <Reveal>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Box
              aria-hidden
              sx={{ width: 28, height: 3, backgroundColor: BRAND_GOLD, borderRadius: 999 }}
            />
            <Typography variant="overline" color="text.secondary">
              Portals
            </Typography>
          </Box>

          <Typography
            id="home-portals-heading"
            variant="h2"
            sx={{ mb: 1.5, color: BRAND_GREEN_DARK }}
          >
            Choose how you want to sign in
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 560 }}>
            Each role has its own portal and its own permissions, enforced by row-level security.
          </Typography>
        </Reveal>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          }}
        >
          {PORTAL_CARDS.map((portal, index) => (
            <Reveal key={portal.href} delayMs={index * 90}>
              <PortalCard portal={portal} />
            </Reveal>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
