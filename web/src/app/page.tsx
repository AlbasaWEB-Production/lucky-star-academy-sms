import Link from "@/components/NextLink";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import SetupBanner from "@/components/SetupBanner";
import SchoolLogo from "@/components/ui/SchoolLogo";
import StudentPhotoCollage from "@/components/ui/StudentPhotoCollage";
import { BRAND_GOLD } from "@/theme";
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

/** A faint gold "Lucky Star" starburst, used as a watermark in the hero. */
function LuckyStarMotif({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Box aria-hidden sx={{ position: "absolute", pointerEvents: "none", color: BRAND_GOLD, ...sx }}>
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.9 6.26 6.9.7-5.15 4.6 1.45 6.74L12 16.9 5.9 20.3l1.45-6.74L2.2 8.96l6.9-.7z" />
      </svg>
    </Box>
  );
}

export default function HomePage() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Honest top nav: logo left, the one link that exists, Sign in + Get started right. */}
      <Box
        component="header"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ display: "flex", alignItems: "center", gap: 3, py: 1.5 }}
        >
          <SchoolLogo sizes="120px" sx={{ height: 34 }} />
          <Box
            component="nav"
            sx={{ display: { xs: "none", sm: "flex" }, gap: 3, flex: 1 }}
          >
            <Typography
              component={Link}
              href="#roles"
              variant="body2"
              sx={{ color: "text.secondary", textDecoration: "none" }}
            >
              Portals
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, ml: "auto" }}>
            <Button component={Link} href="/login" variant="text" sx={{ color: "text.primary" }}>
              Sign in
            </Button>
            <Button component={Link} href="/register/school" variant="contained">
              Get started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero — a full-screen 16:9 brand gradient with subtle school motifs. */}
      <Box
        component="section"
        sx={{
          position: "relative",
          overflow: "hidden",
          minHeight: { xs: "auto", md: "calc(100svh - 64px)" },
          display: "flex",
          alignItems: "center",
          background:
            "linear-gradient(120deg, #F7F7F5 0%, #EAF0E8 42%, rgba(20, 123, 69, 0.16) 100%)",
        }}
      >
        <LuckyStarMotif sx={{ top: "12%", right: "18%", width: 220, height: 220, opacity: 0.1 }} />
        <LuckyStarMotif sx={{ bottom: "18%", left: "6%", width: 120, height: 120, opacity: 0.08 }} />
        <SchoolLogo
          decorative
          sizes="560px"
          sx={{
            position: "absolute",
            right: -120,
            bottom: -120,
            width: 560,
            height: 560,
            opacity: 0.05,
          }}
        />

        <Container
          maxWidth="lg"
          sx={{ py: { xs: 8, md: 12 }, position: "relative", zIndex: 1 }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
              gap: { xs: 6, md: 8 },
              alignItems: "center",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 24, height: 2, backgroundColor: BRAND_GOLD }} />
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  Lucky Star Academy &middot; Yendi, Ghana
                </Typography>
              </Box>

              <Typography
                component="h1"
                variant="h1"
                sx={{ mb: 3, color: "text.primary" }}
              >
                School management, streamlined for{" "}
                <Box
                  component="span"
                  sx={{
                    borderBottom: `3px solid ${BRAND_GOLD}`,
                    paddingBottom: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  every classroom.
                </Box>
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: "text.secondary", maxWidth: 520, mb: 4 }}
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
                  endIcon={<ArrowForwardIcon />}
                >
                  Sign in
                </Button>
                <Button
                  component={Link}
                  href="/register/school"
                  variant="outlined"
                  size="large"
                  sx={{ color: "text.primary", borderColor: "divider" }}
                >
                  Create school
                </Button>
              </Stack>

              <Box sx={{ mt: 5 }}>
                <SetupBanner configured={isSupabaseConfigured()} />
              </Box>
            </Box>

            <StudentPhotoCollage />
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
          <SchoolLogo
            decorative
            sizes="80px"
            sx={{ height: 56, mx: "auto", mb: 2, display: "block" }}
          />
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
    </Box>
  );
}
