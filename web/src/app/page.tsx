import Link from "@/components/NextLink";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import SetupBanner from "@/components/SetupBanner";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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
          backgroundImage: "url(/classroom.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ backgroundColor: "rgba(39, 8, 67, 0.86)" }}>
          <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
            <Typography variant="h3" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>
              School Management System
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 400, maxWidth: 720, mb: 4 }}
            >
              Streamline school management, class organization, attendance tracking and
              communication between students, teachers and administrators.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={Link}
                href="/register/school"
                variant="contained"
                size="large"
                sx={{ backgroundColor: "#fff", color: "secondary.main", "&:hover": { backgroundColor: "#f0ecf7" } }}
              >
                Register your school
              </Button>
              <Button
                component={Link}
                href="/login"
                variant="outlined"
                size="large"
                sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.6)" }}
              >
                Sign in
              </Button>
            </Stack>
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
