"use client";

import { useEffect, useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";

import Link from "@/components/NextLink";
import { BRAND_GOLD, BRAND_GREEN_DARK, DISPLAY_FONT, INK } from "@/theme";

/**
 * The landing nav.
 *
 * Transparent while it sits over the hero — where the school's banner already
 * carries the crest, so the nav deliberately shows no lockup of its own and
 * keeps to the right — and becomes a translucent blurred bar with a hairline
 * once the page scrolls. The lockup fades in at that point, when the banner's
 * crest is gone and there is a bar to put it on.
 *
 * Fixed rather than sticky so it never adds height to the hero, which keeps the
 * hero's photograph and its LCP stable.
 */
export default function HomeNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll(); // in case the page is restored mid-scroll
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Box
      component="header"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        transition:
          "background-color 240ms ease, border-color 240ms ease, box-shadow 240ms ease",
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: "1px solid",
        borderColor: scrolled ? "divider" : "transparent",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          py: scrolled ? 1 : 1.75,
          transition: "padding 240ms ease",
        }}
      >
        <Typography
          component={Link}
          href="/"
          // Hidden and untabbable until it has a bar to sit on, so it never
          // collides with the banner's own crest over the hero.
          style={{ visibility: scrolled ? "visible" : "hidden" }}
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 600,
            fontSize: "1.0625rem",
            letterSpacing: "-0.01em",
            color: BRAND_GREEN_DARK,
            textDecoration: "none",
            opacity: scrolled ? 1 : 0,
            transition: "opacity 240ms ease",
          }}
        >
          Lucky Star Academy
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
          <Button
            component={Link}
            href="#portals"
            variant="text"
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              color: scrolled ? INK : "rgba(255, 255, 255, 0.94)",
              "&:hover": {
                backgroundColor: scrolled
                  ? "rgba(0, 0, 0, 0.04)"
                  : "rgba(255, 255, 255, 0.12)",
              },
              "&:focus-visible": {
                outline: "3px solid",
                outlineColor: scrolled ? BRAND_GREEN_DARK : BRAND_GOLD,
                outlineOffset: 3,
              },
            }}
          >
            Portals
          </Button>

          <Button
            component={Link}
            href="/login"
            variant="contained"
            sx={{
              backgroundColor: BRAND_GOLD,
              color: BRAND_GREEN_DARK,
              "&:hover": { backgroundColor: "#E0A800" },
              "&:focus-visible": {
                outline: "3px solid",
                outlineColor: scrolled ? BRAND_GREEN_DARK : "#FFFFFF",
                outlineOffset: 3,
              },
            }}
          >
            Sign in
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
