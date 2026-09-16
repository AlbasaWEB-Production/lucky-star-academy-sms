import Link from "@/components/NextLink";
import { Box, Button, Container, Paper, Typography } from "@mui/material";

export const metadata = {
  title: "Account not provisioned",
};

/**
 * Shown when a signed-in user has no school_id in app_metadata.
 *
 * This happens if an account is created directly in the Supabase Dashboard
 * rather than through the app, since only the Auth admin API can write
 * app_metadata, and RLS has nothing to scope queries by without it.
 */
export default function SetupRequiredPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 2, color: "secondary.main" }}>
          Your account is not fully set up
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your account is missing the role and school information the app needs, so it cannot
          load any school data. This normally means the account was created outside the app.
        </Typography>

        <Typography variant="body2" color="text.secondary">
          An administrator should create your account from the dashboard, which sets these
          values automatically.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Button component={Link} href="/login" variant="contained">
            Back to sign in
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
