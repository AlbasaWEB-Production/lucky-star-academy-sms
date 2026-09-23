import type { ReactNode } from "react";

import { Box, Container, Paper, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import Link from "@/components/NextLink";
import Reveal from "@/components/home/Reveal";
import { ROLE_ORDER, roleLabel, roleSlug } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/supabase/database.types";
import { BRAND_GOLD, BRAND_GREEN_DARK, DISPLAY_FONT, PAGE_BG } from "@/theme";

/**
 * The five portals, each a door rather than a tile.
 *
 * The numerals are set on a solid gold badge rather than drawn as gold text: the
 * design system keeps gold off white as a text colour (it fails contrast), so
 * the gold is the fill and the numeral is deep green on top of it.
 *
 * The whole card is the link, so the entire surface is one target and the
 * "Continue" line is an affordance rather than a second, smaller control.
 *
 * Everything but the copy is DERIVED. The order, the numeral, the title and the
 * sign-in href all come from `ROLE_ORDER` / `roleLabel` / `roleSlug` in
 * `@/lib/auth/roles`, so adding a sixth role cannot leave this page showing
 * five cards, or show 05 for a role the sign-in chooser numbers 06. The copy
 * map below is a `Record<UserRole, …>`, so a new role fails to compile here
 * until someone writes its sentence - which is the point.
 *
 * The href assumes the convention that a role's sign-in page is
 * `/login/<roleSlug>`; that holds for all five and is what `/login` routes to.
 */
const CARD_COPY: Record<UserRole, { description: string; icon: ReactNode }> = {
  admin: {
    description: "Manage students, teachers, classes, subjects, notices and complaints.",
    icon: <AdminPanelSettingsIcon />,
  },
  teacher: {
    description: "Take attendance, record exam marks and review your classes.",
    icon: <MenuBookIcon />,
  },
  student: {
    description: "View your subjects, attendance and marks, and submit a complaint.",
    icon: <SchoolIcon />,
  },
  accountant: {
    description: "Issue fee assessments, bank payments and record school expenses.",
    icon: <AccountBalanceWalletIcon />,
  },
  schedule_officer: {
    description: "Build the weekly timetable so every class and teacher has its slots.",
    icon: <CalendarMonthIcon />,
  },
};

const ROLE_CARDS = ROLE_ORDER.map((role, index) => ({
  href: `/login/${roleSlug[role]}`,
  numeral: String(index + 1).padStart(2, "0"),
  title: roleLabel[role],
  ...CARD_COPY[role],
}));

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
            // Three across from `md`; the five cards therefore flow as 3 + 2.
            // Deliberately not five narrow columns - each card carries a
            // description sentence and would wrap to an unreadable column.
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          }}
        >
          {ROLE_CARDS.map((card, index) => (
            <Reveal key={card.href} delayMs={index * 90}>
              <Paper
                component={Link}
                href={card.href}
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
                    {card.icon}
                  </Box>

                  {/* Solid gold badge, deep-green numeral — gold as a fill, never
                      as text on the light card. */}
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
                      // The token constant, not a `(theme) => …` callback: this
                      // file is a server component, and a function inside `sx`
                      // cannot be serialized across to MUI's client components.
                      fontFamily: DISPLAY_FONT,
                      fontSize: "1.375rem",
                      fontWeight: 600,
                      lineHeight: 1,
                    }}
                  >
                    {card.numeral}
                  </Box>
                </Box>

                {/* Explicit `component="h3"`: the theme maps the h5 *variant* to
                    an `<h1>` tag so page titles get the top level, but on this
                    page the hero owns the only h1. The cards are subsections of
                    the section's h2. */}
                <Typography variant="h5" component="h3" sx={{ color: BRAND_GREEN_DARK }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
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
            </Reveal>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
