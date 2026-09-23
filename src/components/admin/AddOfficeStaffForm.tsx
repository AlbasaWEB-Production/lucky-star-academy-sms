"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";

import PasswordField from "@/components/auth/PasswordField";
import { createOfficeStaffAction } from "@/lib/actions/staff";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Creates one of the two office staff accounts - an accountant or a schedule
 * officer.
 *
 * Both sign in with a real email address, so a Supabase Auth user is created
 * from these fields, which is why a password is collected here. Nothing else is
 * asked for: neither role has a class, a roll number or a subject to be
 * attached to, so an account is the whole record.
 *
 * The role is a picker rather than two separate pages because the two accounts
 * differ only in what RLS lets them reach - see the finance and timetable
 * policies in supabase/migrations. The server action refuses anything outside
 * those two values, so the picker is a convenience and not the control.
 */
export default function AddOfficeStaffForm() {
  const [state, formAction, isPending] = useActionState(createOfficeStaffAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <Typography variant="overline" color="text.secondary">
        Staff details
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <TextField name="fullName" label="Full name" required fullWidth autoFocus margin="none" />

        <TextField
          name="email"
          label="Email address"
          type="email"
          required
          fullWidth
          margin="none"
          helperText="They sign in with this address."
        />
      </Box>

      <TextField
        name="role"
        label="Role"
        select
        required
        fullWidth
        margin="normal"
        defaultValue="accountant"
        helperText="Sets which portal opens and which records the account can reach."
      >
        <MenuItem value="accountant">Accountant - fees, payments and expenses</MenuItem>
        <MenuItem value="schedule_officer">Schedule Officer - the weekly timetable</MenuItem>
      </TextField>

      <Typography variant="overline" color="text.secondary" sx={{ mt: 3 }}>
        Login
      </Typography>

      <PasswordField
        name="password"
        label="Temporary password"
        required
        fullWidth
        margin="normal"
        helperText="At least 8 characters. Share it with them; they can change it from their profile."
      />

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Add staff account"}
      </Button>
    </Box>
  );
}
