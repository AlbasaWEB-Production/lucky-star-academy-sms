import Link from "@/components/NextLink";
import { Box, Button, Container, Paper, Typography } from "@mui/material";

import SchoolLogo from "@/components/ui/SchoolLogo";
import SiteFooter from "@/components/ui/SiteFooter";

export const metadata = {
  title: "Sign in",
};

const PORTALS = [
  { href: "/login/admin", title: "Administrator", hint: "Signs in with an email address." },
  { href: "/login/teacher", title: "Teacher", hint: "Signs in with an email address." },
  { href: "/login/student", title: "Student", hint: "Signs in with a roll number and name." },
];

export default function LoginChooserPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, flex: 1 }}>
        <SchoolLogo
          priority
          sizes="(min-width: 900px) 165px, 135px"
          sx={{ height: { xs: 112, md: 136 }, mb: 4, justifyContent: "center" }}
        />

        <Typography variant="h5" sx={{ mb: 1, color: "secondary.main" }}>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Choose the portal that matches your account.
        </Typography>

        <Box sx={{ display: "grid", gap: 2 }}>
          {PORTALS.map((portal) => (
            <Paper
              key={portal.href}
              variant="outlined"
              sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {portal.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {portal.hint}
                </Typography>
              </Box>

              <Button component={Link} href={portal.href} variant="contained">
                Continue
              </Button>
            </Paper>
          ))}
        </Box>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Lucky Star Academy is already provisioned — choose a portal above to sign in.
          </Typography>
        </Box>
      </Container>

      <SiteFooter />
    </Box>
  );
}
