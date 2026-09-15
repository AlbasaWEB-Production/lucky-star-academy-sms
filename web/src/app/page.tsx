import Link from "@/components/NextLink";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import SetupBanner from "@/components/SetupBanner";
import SchoolLogo from "@/components/ui/SchoolLogo";
import StudentPhotoCollage from "@/components/ui/StudentPhotoCollage";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Lucky Star Academy | School Management System",
};

const ROLE_CARDS = [
  {
    href: "/login/admin",
    title: "Administrator",
    description: "Manage students, teachers, classes, subjects, notices and complaints.",
    icon: <AdminPanelSettingsIcon fontSize="large" />,
  },
  {
    href: "/login/teacher",
    title: "Teacher",
    description: "Take attendance, record exam marks and review your classes.",
    icon: <MenuBookIcon fontSize="large" />,
  },
  {
    href: "/login/student",
    title: "Student",
    description: "View your subjects, attendance and marks, and submit a complaint.",
    icon: <SchoolIcon fontSize="large" />,
  },
];

export default function HomePage() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      <Box
        sx={{
          backgroundImage: "url(/lucky_star_background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {/*
          The scrim runs dark on the left and clears by ~72% so the photo
          collage on the right sits on the artwork rather than under the wash.
          On narrow screens the columns stack, so the gradient becomes vertical
          and the text keeps its contrast above the photos.
        */}
        <Box
          sx={{
            backgroundImage: {
              xs: "linear-gradient(180deg, rgba(8, 62, 40, 0.88) 0%, rgba(8, 62, 40, 0.72) 55%, rgba(8, 62, 40, 0.5) 100%)",
              md: "linear-gradient(90deg, rgba(8, 62, 40, 0.90) 0%, rgba(8, 62, 40, 0.68) 38%, rgba(8, 62, 40, 0.12) 72%, rgba(8, 62, 40, 0) 100%)",
            },
          }}
        >
          <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
                gap: { xs: 6, md: 6 },
                alignItems: "center",
              }}
            >
              <Box>
                <SchoolLogo
                  component="h1"
                  priority
                  sizes="(min-width: 900px) 205px, 160px"
                  sx={{ height: { xs: 132, md: 168 }, m: 0, mb: 3 }}
                />
                <Typography
                  variant="h6"
                  sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 400, maxWidth: 720, mb: 4 }}
                >
                  Yendi, Northern Region, Ghana · Primary 1–6. Streamline class organization,
                  attendance tracking, exam marks and communication between students, teachers and
                  administrators.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    component={Link}
                    href="/login"
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: "#fff",
                      color: "secondary.main",
                      "&:hover": { backgroundColor: "#f0ecf7" },
                    }}
                  >
                    Sign in
                  </Button>
                </Stack>
              </Box>

              <StudentPhotoCollage />
            </Box>
          </Container>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <SetupBanner configured={isSupabaseConfigured()} />

        <Typography variant="h5" sx={{ mb: 1, color: "secondary.main" }}>
          Choose how you want to sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Each role has its own portal and its own permissions.
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
                p: 3,
                textDecoration: "none",
                display: "block",
                transition: "border-color 120ms ease, transform 120ms ease",
                "&:hover": {
                  borderColor: "primary.main",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box sx={{ color: "primary.main", mb: 1.5 }}>{card.icon}</Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {card.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
