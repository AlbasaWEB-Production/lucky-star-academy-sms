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
import { portalHref } from "@/lib/site/host";
import { SITE_NAV } from "@/lib/site/routes";
import { BRAND_GOLD, BRAND_GREEN_DARK, DISPLAY_FONT, INK } from "@/theme";

/**
 * The public website's navigation.
 *
 * Transparent while it sits over a dark band — every public page opens with one
 * (the home page's banner hero, or the deep-green `PageHero` on the others) — and
 * a translucent blurred bar with a hairline once the page scrolls.
 *
 * The lockup is suppressed only over the home hero, because the school's own
 * banner already carries the crest and the school name as artwork, and two
 * lockups a few centimetres apart reads as a mistake. Every other page has a
 * plain green band there, so the lockup shows from the first frame.
 *
 * Links are rendered twice: inline from `sm` up, and in a drawer on phones. The
 * two share `SITE_NAV`, so a new page appears in both.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = pathname === "/";
  /** Over the banner hero the school's artwork is the lockup; elsewhere we carry it. */
  const showLockup = scrolled || !isHome;
  /** Text sits on a dark band until the bar turns white. */
  const onDark = !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll(); // in case the page is restored mid-scroll
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A route change should never leave the drawer open behind the new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const linkSx = (href: string) => ({
    fontWeight: 600,
    fontSize: "0.9375rem",
    textDecoration: "none",
    whiteSpace: "nowrap" as const,
    px: 1.25,
    py: 0.75,
    borderRadius: 999,
    color: isActive(href) ? (onDark ? BRAND_GOLD : BRAND_GREEN_DARK) : onDark ? "#FFFFFF" : INK,
    backgroundColor: "transparent",
    "&:hover": { backgroundColor: onDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.05)" },
    "&:focus-visible": {
      outline: "3px solid",
      outlineColor: onDark ? BRAND_GOLD : BRAND_GREEN_DARK,
      outlineOffset: 2,
    },
  });

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
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.86)" : "transparent",
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
          py: scrolled ? 1 : 1.5,
          transition: "padding 240ms ease",
        }}
      >
        <Box
          component={Link}
          href="/"
          aria-label="Lucky Star Academy — home"
          sx={{
            // On md and up the lockup keeps its space while hidden, so the bar
            // does not shift when it fades in over the home hero. On phones
            // that reserved width is what pushed the menu button off the right
            // edge — and a document wider than the viewport clips *every*
            // section on the page, not just the header — so below md it is
            // removed from the layout instead of merely hidden.
            display: { xs: showLockup ? "flex" : "none", md: "flex" },
            visibility: { md: showLockup ? "visible" : "hidden" },
            opacity: { xs: 1, md: showLockup ? 1 : 0 },
            alignItems: "center",
            gap: 1.25,
            minWidth: 0,
            textDecoration: "none",
            transition: "opacity 240ms ease",
          }}
        >
          <SchoolLogo decorative sizes="40px" sx={{ height: 34, flexShrink: 0 }} />
          <Typography
            sx={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 600,
              fontSize: "1.0625rem",
              letterSpacing: "-0.01em",
              color: onDark ? "#FFFFFF" : BRAND_GREEN_DARK,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Lucky Star Academy
          </Typography>
        </Box>

        {/* Inline links — tablet and up. */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 0.5,
            ml: "auto",
          }}
        >
          <Box component="nav" aria-label="Main">
            <Stack direction="row" sx={{ alignItems: "center", gap: 0.25 }}>
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
            href={portalHref("/login")}
            variant="contained"
            sx={{
              ml: 1.5,
              backgroundColor: BRAND_GOLD,
              color: BRAND_GREEN_DARK,
              "&:hover": { backgroundColor: "#E0A800" },
            }}
          >
            Portal login
          </Button>
        </Box>

        {/* Phone: one control only. "Portal login" lives in the drawer, which
            is where a phone user is already heading — keeping a second button
            in the bar as well was what tipped the row into horizontal
            overflow at 390px. */}
        <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", ml: "auto" }}>
          <IconButton
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            sx={{
              color: onDark ? "#FFFFFF" : INK,
              border: "1px solid",
              borderColor: onDark ? "rgba(255,255,255,0.4)" : "divider",
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Container>

      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: "82vw", sm: 340 }, p: 2 } } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Typography
            sx={{ fontFamily: DISPLAY_FONT, fontWeight: 600, color: BRAND_GREEN_DARK }}
          >
            Menu
          </Typography>
          <IconButton
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            sx={{ ml: "auto" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Box
          component="nav"
          aria-label="Main"
          sx={{ display: "flex", flexDirection: "column" }}
        >
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

        <Button
          component={Link}
          href={portalHref("/login")}
          variant="contained"
          fullWidth
          onClick={() => setMenuOpen(false)}
          sx={{ backgroundColor: BRAND_GOLD, color: BRAND_GREEN_DARK, "&:hover": { backgroundColor: "#E0A800" } }}
        >
          Portal login
        </Button>
      </Drawer>
    </Box>
  );
}
