import Link from "@/components/NextLink";
import { Box, Button, Container, Paper, Typography } from "@mui/material";

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
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 } }}>
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
          New school?{" "}
          <Link href="/register/school" style={{ color: "#7f56da", fontWeight: 600 }}>
            Register here
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}
