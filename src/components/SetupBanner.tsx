"use client";

import { Alert, AlertTitle, Box, Link as MuiLink, Typography } from "@mui/material";

/**
 * Shown until the Supabase project is connected.
 *
 * Without it, an unconfigured deployment would fail with a thrown
 * "Missing environment variable" error on first query, which is a poor first
 * impression and gives no hint about the fix.
 */
export default function SetupBanner({ configured }: { configured: boolean }) {
  if (configured) {
    return null;
  }

  return (
    <Alert severity="warning" sx={{ mb: 3 }}>
      <AlertTitle>Supabase is not connected yet</AlertTitle>
      <Typography variant="body2" component="div" sx={{ mb: 1 }}>
        The database, authentication and Row Level Security policies are in place, but no
        Supabase project is linked, so sign-in and all data pages will fail. To finish setup:
      </Typography>
      <Box component="ol" sx={{ pl: 3, m: 0, "& li": { mb: 0.5 } }}>
        <li>
          Create a project at{" "}
          <MuiLink href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
            supabase.com/dashboard
          </MuiLink>
          .
        </li>
        <li>
          Apply <code>supabase/migrations/*.sql</code> in the SQL editor (or run{" "}
          <code>supabase db push</code>).
        </li>
        <li>
          Copy <code>.env.example</code> to <code>.env.local</code> and paste your project
          URL, anon key and secret key.
        </li>
        <li>Restart the dev server.</li>
      </Box>
    </Alert>
  );
}
