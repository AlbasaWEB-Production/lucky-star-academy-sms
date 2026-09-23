import { Box, Paper, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import Link from "@/components/NextLink";
import { BRAND_GOLD, BRAND_GREEN_DARK, DISPLAY_FONT } from "@/theme";
import type { PortalCardData } from "./portals";

/**
 * One portal, as a door rather than a tile.
 *
 * The whole card is the link, so the entire surface is one target and the
 * "Continue" line is an affordance rather than a second, smaller control. The
 * numeral sits on a solid gold badge rather than being drawn as gold text: the
 * design system keeps gold off white as a text colour (it fails contrast), so
 * the gold is the fill and the numeral is deep green on top of it.
 *
 * Shared by the landing page and the sign-in chooser. That is the point of it
 * living here: the two pages previously drew the same five portals with two
 * different card designs, and the chooser had fallen a redesign behind. A
 * change to this file now moves both together, which is what "reconcile" has to
 * mean if it is going to stay true.
 *
 * Server-safe: no hooks, no state, no event handlers. The caller wraps it in
 * `Reveal` if it wants the entrance animation.
 */
export default function PortalCard({ portal }: { portal: PortalCardData }) {
  return (
    <Paper
      component={Link}
      href={portal.href}
      variant="outlined"
      sx={{
        p: { xs: 3, md: 3.5 },
        height: "100%",
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        borderColor: "divider",
        boxShadow: "0 2px 10px rgba(8, 62, 40, 0.04)",
        transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: "primary.main",
          boxShadow: "0 18px 36px rgba(8, 62, 40, 0.14)",
        },
        "&:hover .portal-arrow": { transform: "translateX(4px)" },
        "&:focus-visible": {
          outline: "3px solid",
          outlineColor: "primary.main",
          outlineOffset: 3,
        },
        // Reduced motion: no lift, no arrow slide, no shadow transition.
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&:hover": { transform: "none" },
          "&:hover .portal-arrow": { transform: "none" },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
        <Box
          aria-hidden
          sx={{
            color: "primary.main",
            display: "grid",
            placeItems: "center",
            width: 48,
            height: 48,
            borderRadius: "14px",
            bgcolor: "rgba(20, 123, 69, 0.10)",
          }}
        >
          {portal.icon}
        </Box>

        {/* Solid gold badge, deep-green numeral — gold as a fill, never as text
            on the light card. */}
        <Box
          sx={{
            ml: "auto",
            minWidth: 52,
            height: 44,
            px: 1.25,
            borderRadius: "14px",
            backgroundColor: BRAND_GOLD,
            color: BRAND_GREEN_DARK,
            display: "grid",
            placeItems: "center",
            // The token constant, not a `(theme) => …` callback: this file is a
            // server component, and a function inside `sx` cannot be serialized
            // across to MUI's client components.
            fontFamily: DISPLAY_FONT,
            fontSize: "1.375rem",
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {portal.numeral}
        </Box>
      </Box>

      {/* Explicit `component="h3"`: the theme maps the h5 *variant* to an `<h1>`
          tag so page titles get the top level, but on these pages the hero owns
          the only h1. The cards are subsections of the section's h2. */}
      <Typography variant="h5" component="h3" sx={{ color: BRAND_GREEN_DARK }}>
        {portal.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {portal.description}
      </Typography>

      <Box
        sx={{
          mt: "auto",
          pt: 1,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: "primary.main",
          fontWeight: 600,
        }}
      >
        Continue{" "}
        <Box
          component={ArrowForwardIcon}
          className="portal-arrow"
          fontSize="small"
          sx={{ transition: "transform 200ms ease" }}
        />
      </Box>
    </Paper>
  );
}
