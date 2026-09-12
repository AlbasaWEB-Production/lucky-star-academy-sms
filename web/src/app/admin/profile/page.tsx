import { Box, Paper, TextField, Typography } from "@mui/material";

import ProfileNameForm from "@/components/account/ProfileNameForm";
import PageHeader from "@/components/ui/PageHeader";
import { loadShellContext } from "@/lib/auth/shell-context";
import { getSchool } from "@/lib/data/queries";

export const metadata = {
  title: "My profile",
};

/**
 * The signed-in admin's own account, plus the school they administer.
 *
 * The shell context is loaded rather than only the raw session: it prefers the
 * `profiles.full_name` the rename form writes over the `app_metadata` copy the
 * JWT carries, so this page shows the name the admin just saved instead of a
 * stale one. The row-level reads inside it are scoped by RLS like every other
 * read; nothing here re-checks the role, because the `/admin` layout did.
 */
export default async function AdminProfilePage() {
  const { session, fullName, email } = await loadShellContext("admin");
  const school = await getSchool(session.schoolId);

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Your own account details and the school you administer."
      />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
          alignItems: "start",
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Your name
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This is the name shown in the portal and used to sign in.
          </Typography>

          <ProfileNameForm currentName={fullName} />
        </Paper>

        <Box sx={{ display: "grid", gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Sign-in address
            </Typography>

            <TextField
              value={email ?? "Not set"}
              label="Email"
              fullWidth
              margin="normal"
              slotProps={{ input: { readOnly: true } }}
              helperText="This is the address you sign in with, so it cannot be changed here. Changing an email is an identity change and is handled when accounts are provisioned."
            />
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              School
            </Typography>

            <Box sx={{ display: "grid", gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  School name
                </Typography>
                <Typography variant="body1">{school?.name ?? "Unknown school"}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  School identifier
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                  {school?.slug ?? "Not set"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This identifier is part of how your school is addressed when people sign in.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
