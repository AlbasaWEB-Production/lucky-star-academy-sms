import Image from "next/image";
import Link from "@/components/NextLink";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import SetupBanner from "@/components/SetupBanner";
import SiteFooter from "@/components/ui/SiteFooter";
import { BRAND_GOLD, BRAND_GREEN_DARK } from "@/theme";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Lucky Star Academy | School Management System",
};

const ROLE_CARDS = [
  {
    href: "/login/admin",
    title: "Administrator",
    description: "Manage students, teachers, classes, subjects, notices and complaints.",
    icon: <AdminPanelSettingsIcon />,
  },
  {
    href: "/login/teacher",
    title: "Teacher",
    description: "Take attendance, record exam marks and review your classes.",
    icon: <MenuBookIcon />,
  },
  {
    href: "/login/student",
    title: "Student",
    description: "View your subjects, attendance and marks, and submit a complaint.",
    icon: <SchoolIcon />,
  },
];

/**
 * White text over the hero banner (the banner's left band is a deep green, so
 * white passes AA). Gold is reserved for the one bold accent — the primary
 * CTAs and the underline — never as text on a light ground.
 */
const HERO_TEXT = "#FFFFFF";

export default function HomePage() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Hero — the school's own banner photograph, full-bleed. The banner already
          carries the crest and school name, so no separate logo is drawn here. */}
      <Box
        component="section"
        sx={{
          position: "relative",
          overflow: "hidden",
          minHeight: { xs: "auto", md: "100svh" },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Image
          src="/sms_background_image.png"
          alt="Lucky Star Academy pupils collaborating over a robot in the school's ICT room, with the school building and flag behind them"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        {/* Legibility scrim across the text band, blending with the banner's own
            deep green so the headline stays readable over the photograph. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(8,62,40,0.92) 0%, rgba(8,62,40,0.6) 42%, rgba(8,62,40,0.12) 70%, rgba(8,62,40,0) 100%)",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, width: "100%" }}>
          {/* Honest top bar over the hero: the one link that exists, with the two
              actions. Kept to text/outline so it stays a quiet frame. */}
          <Box
            component="header"
            sx={{ display: "flex", alignItems: "center", gap: 3, py: 2 }}
          >
            <Box component="nav" sx={{ display: { xs: "none", sm: "flex" }, gap: 3, flex: 1 }}>
              <Typography
                component={Link}
                href="#roles"
                variant="body2"
                sx={{ color: HERO_TEXT, textDecoration: "none" }}
              >
                Portals
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, ml: "auto" }}>
              <Button component={Link} href="/login" variant="text" sx={{ color: HERO_TEXT }}>
                Sign in
              </Button>
              <Button
                component={Link}
                href="/register/school"
                variant="outlined"
                sx={{
                  color: HERO_TEXT,
                  borderColor: "rgba(255,255,255,0.7)",
                  "&:hover": { borderColor: HERO_TEXT, backgroundColor: "rgba(255,255,255,0.08)" },
                }}
              >
                Get started
              </Button>
            </Box>
          </Box>

          {/* Hero copy, sitting on the banner's deep-green band. */}
          <Box sx={{ py: { xs: 8, md: 14 }, maxWidth: { xs: "100%", md: 560 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 24, height: 2, backgroundColor: BRAND_GOLD }} />
              <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.85)" }}>
                Lucky Star Academy &middot; Yendi, Ghana
              </Typography>
            </Box>

            <Typography
              component="h1"
              variant="h1"
              sx={{ mb: 3, color: HERO_TEXT }}
            >
              School management, streamlined for{" "}
              <Box
                component="span"
                sx={{
                  borderBottomWidth: 3,
                  borderBottomStyle: "solid",
                  borderBottomColor: BRAND_GOLD,
                  paddingBottom: 2,
                  whiteSpace: "nowrap",
                }}
              >
                every classroom.
              </Box>
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: "rgba(255,255,255,0.92)", maxWidth: 520, mb: 4 }}
            >
              Lucky Star Academy, Yendi &middot; Primary 1–6. Class organization,
              attendance, exam marks and communication — one place for students,
              teachers and administrators.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={Link}
                href="/login"
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: BRAND_GOLD,
                  color: BRAND_GREEN_DARK,
                  "&:hover": { backgroundColor: BRAND_GOLD },
                }}
                endIcon={<ArrowForwardIcon />}
              >
                Sign in
              </Button>
              <Button
                component={Link}
                href="/register/school"
                variant="outlined"
                size="large"
                sx={{
                  color: HERO_TEXT,
                  borderColor: "rgba(255,255,255,0.7)",
                  "&:hover": { borderColor: HERO_TEXT, backgroundColor: "rgba(255,255,255,0.08)" },
                }}
              >
                Create school
              </Button>
            </Stack>

            <Box sx={{ mt: 5 }}>
              <SetupBanner configured={isSupabaseConfigured()} />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Role portals — a door for each role, with an explicit "Continue" affordance. */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }} component="section" id="roles">
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1 }}>
          Portals
        </Typography>
        <Typography variant="h4" sx={{ mb: 1, color: "secondary.main" }}>
          Choose how you want to sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 520 }}>
          Each role has its own portal and its own permissions, enforced by row-level security.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          }}
        >
          {ROLE_CARDS.map((card) => (
            <Paper
              key={card.href}
              component={Link}
              href={card.href}
              variant="outlined"
              sx={{
                p: 3.5,
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                borderRadius: "20px",
                transition: "border-color 120ms ease, box-shadow 120ms ease",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: "0 12px 24px rgba(8, 62, 40, 0.08)",
                },
              }}
            >
              <Box
                sx={{
                  color: "primary.main",
                  display: "grid",
                  placeItems: "center",
                  width: 48,
                  height: 48,
                  borderRadius: "14px",
                  bgcolor: "rgba(20, 123, 69, 0.1)",
                }}
              >
                {card.icon}
              </Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {card.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.description}
              </Typography>
              <Box
                sx={{
                  mt: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "primary.main",
                  fontWeight: 600,
                }}
              >
                Continue <ArrowForwardIcon fontSize="small" />
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* A short "this school" line in its own words, with the crest. */}
      <Box
        component="section"
        sx={{ py: { xs: 6, md: 10 }, textAlign: "center", backgroundColor: "background.paper" }}
      >
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: "secondary.main", mb: 1 }}>
            Lucky Star Academy, Yendi
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto" }}
          >
            A Primary 1–6 school in the Northern Region of Ghana. This system is how our
            office, teachers and families share attendance, results and notices in one place.
          </Typography>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}
