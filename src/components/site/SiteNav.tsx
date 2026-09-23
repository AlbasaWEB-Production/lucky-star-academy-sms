"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";

import Link from "@/components/NextLink";
import SchoolLogo from "@/components/ui/SchoolLogo";
import { school } from "@/content/site";
import { portalHref } from "@/lib/site/host";
import { SITE_NAV } from "@/lib/site/routes";
import { BRAND_GOLD, BRAND_GREEN_DARK, DISPLAY_FONT, INK } from "@/theme";

/**
 * The site header.
 *
 * Rebuilt on the reference layout's header: a solid, sticky white bar with the
 * school's lockup on the left, the links, and a single gold call to action.
 *
 * The previous version was a transparent bar over a full-bleed dark hero that
 * faded to white on scroll and hid its own lockup while over the banner. That
 * was clever and it caused a real bug: on a 390px phone the reserved space for
 * the hidden lockup plus a second button in the bar pushed the menu control off
 * the right edge, which made the document wider than the viewport and clipped
 * every section on every page. A solid header cannot have that failure, and it
 * is what the reference does — so the scroll listener, the colour switching and
 * the hidden lockup are all gone rather than fixed.
 *
 * The lockup is a two-line mark — the school's name over its location and
 * classes — which is the reference's treatment and puts the two facts a visitor
 * most needs into the first thing they read.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // A route change should never leave the drawer open behind the new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const linkSx = (href: string) => ({
    position: "relative",
    fontWeight: 650,
    fontSize: "0.875rem",
    textDecoration: "none",
    whiteSpace: "nowrap" as const,
    color: isActive(href) ? BRAND_GREEN_DARK : INK,
    py: 1,
    "&::after": {
      content: '""',
      position: "absolute",
      left: 0,
      right: isActive(href) ? 0 : "100%",
      bottom: 4,
      height: 2,
      backgroundColor: BRAND_GOLD,
      transition: "right 200ms ease",
    },
    "&:hover::after": { right: 0 },
    "&:focus-visible": { outline: `2px solid ${BRAND_GREEN_DARK}`, outlineOffset: 3 },
  });

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        backgroundColor: "rgba(255, 255, 255, 0.97)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1.5, md: 4 },
          minHeight: { xs: 72, md: 92 },
        }}
      >
        {/* Lockup */}
        <Box
          component={Link}
          href="/"
          aria-label={`${school.name} — home`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            textDecoration: "none",
            minWidth: 0,
            flexShrink: 0,
          }}
        >
          <SchoolLogo decorative sizes="48px" sx={{ height: { xs: 38, md: 46 }, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 600,
                fontSize: { xs: "1rem", md: "1.1875rem" },
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
                color: BRAND_GREEN_DARK,
                whiteSpace: "nowrap",
              }}
            >
              Lucky Star Academy
            </Typography>
            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "text.secondary",
                mt: 0.5,
                whiteSpace: "nowrap",
              }}
            >
              {school.town} &middot; {school.levels}
            </Typography>
          </Box>
        </Box>

        {/* Links, tablet and up */}
        <Box
          component="nav"
          aria-label="Main"
          sx={{ display: { xs: "none", md: "block" }, ml: "auto" }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 3 }}>
            {SITE_NAV.filter((item) => item.href !== "/").map((item) => (
              <Box
                key={item.href}
                component={Link}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                sx={linkSx(item.href)}
              >
                {item.label}
              </Box>
            ))}
          </Stack>
        </Box>

        <Button
          component={Link}
          href="/admissions"
          variant="contained"
          sx={{
            display: { xs: "none", md: "inline-flex" },
            ml: 3,
            backgroundColor: BRAND_GOLD,
            color: BRAND_GREEN_DARK,
            "&:hover": { backgroundColor: "#E0A800" },
          }}
        >
          Apply now
        </Button>

        {/* Phone: one control. The drawer carries everything, including the
            apply button and the portal link, so the bar never has to fit them. */}
        <IconButton
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            ml: "auto",
            color: INK,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <MenuIcon />
        </IconButton>
      </Container>

      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: "84vw", sm: 340 }, p: 2 } } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 600, color: BRAND_GREEN_DARK }}>
            Menu
          </Typography>
          <IconButton onClick={() => setMenuOpen(false)} aria-label="Close menu" sx={{ ml: "auto" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Box component="nav" aria-label="Main" sx={{ display: "flex", flexDirection: "column" }}>
          {SITE_NAV.map((item) => (
            <Box
              key={item.href}
              component={Link}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
              sx={{
                py: 1.5,
                px: 1,
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: 600,
                color: isActive(item.href) ? BRAND_GREEN_DARK : INK,
                backgroundColor: isActive(item.href) ? "rgba(20,123,69,0.08)" : "transparent",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              }}
            >
              {item.label}
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack sx={{ gap: 1.5 }}>
          <Button
            component={Link}
            href="/admissions"
            variant="contained"
            fullWidth
            onClick={() => setMenuOpen(false)}
            sx={{
              backgroundColor: BRAND_GOLD,
              color: BRAND_GREEN_DARK,
              "&:hover": { backgroundColor: "#E0A800" },
            }}
          >
            Apply now
          </Button>

          <Button
            component={Link}
            href={portalHref("/login")}
            variant="outlined"
            fullWidth
            onClick={() => setMenuOpen(false)}
            sx={{ color: BRAND_GREEN_DARK, borderColor: "divider" }}
          >
            Portal login
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}
