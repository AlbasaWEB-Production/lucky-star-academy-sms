import Image from "next/image";
import Link from "@/components/NextLink";
import { Box, Button, Container, Paper, Typography } from "@mui/material";

import SchoolLogo from "@/components/ui/SchoolLogo";
import SiteFooter from "@/components/ui/SiteFooter";

export const metadata = {
  title: "Sign in",
};

/**
 * The five portals, in the same order and with the same numerals as the
 * landing page cards (`HomePortals`), so a visitor who came from there finds
 * the same shape and the same 01-05 numbering.
 *
 * Administrator, Teacher and Student keep 01-03; the accountant and the
 * schedule officer append as 04 and 05.
 */
const PORTALS = [
  { href: "/login/admin", title: "Administrator", hint: "Signs in with an email address." },
  { href: "/login/teacher", title: "Teacher", hint: "Signs in with an email address." },
  { href: "/login/student", title: "Student", hint: "Signs in with a roll number and name." },
  { href: "/login/accountant", title: "Accountant", hint: "Signs in with an email address." },
  { href: "/login/schedule", title: "Schedule Officer", hint: "Signs in with an email address." },
];

/** White text over the banner's deep-green band (passes AA). */
const HERO_TEXT = "#FFFFFF";

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
      {/* Sign-in panel over the school's banner photograph, matching the home hero. */}
      <Box
        component="section"
        sx={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Image
          src="/sms_background_image.png"
          alt="Lucky Star Academy pupils collaborating over a robot in the school's ICT room"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        {/* Scrim across the banner so the cards and heading stay legible. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(8,62,40,0.82) 0%, rgba(8,62,40,0.5) 45%, rgba(8,62,40,0.22) 100%)",
          }}
        />

        <Container
          maxWidth="sm"
          sx={{ position: "relative", zIndex: 1, py: { xs: 8, md: 12 }, flex: 1 }}
        >
          <SchoolLogo
            priority
            sizes="(min-width: 900px) 165px, 135px"
            sx={{ height: { xs: 112, md: 136 }, mb: 4, justifyContent: "center" }}
          />

          <Typography variant="h5" sx={{ mb: 1, color: HERO_TEXT }}>
            Sign in
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", mb: 4 }}>
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
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
              Lucky Star Academy is already provisioned — choose a portal above to sign in.
            </Typography>
          </Box>
        </Container>
      </Box>

      <SiteFooter />
    </Box>
  );
}
