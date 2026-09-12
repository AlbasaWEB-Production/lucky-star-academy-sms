"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField, Typography } from "@mui/material";

import { registerSchoolAction } from "@/lib/auth/actions";
import { initialAuthFormState } from "@/lib/auth/form-state";
import PasswordField from "./PasswordField";

/**
 * Creates a school and its first administrator.
 *
 * This is the only flow that can originate a tenant. It runs entirely on the
 * server: the auth user, the school row, its app_metadata claims and the
 * profile are written with the secret key, in that order, so a partial
 * failure is rolled back rather than leaving a half-registered school.
 */
export default function RegisterSchoolForm() {
  const [state, formAction, isPending] = useActionState(
    registerSchoolAction,
    initialAuthFormState,
  );

  return (
    <Box component="form" action={formAction} noValidate>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
        School
      </Typography>

      <TextField
        name="schoolName"
        label="School name"
        placeholder="Lucky Star Academy"
        required
        fullWidth
        autoFocus
        margin="normal"
        helperText="Used to generate your school's unique identifier."
      />

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
        Administrator
      </Typography>

      <TextField
        name="adminName"
        label="Your full name"
        autoComplete="name"
        required
        fullWidth
        margin="normal"
      />

      <TextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        fullWidth
        margin="normal"
        helperText="You will sign in with this address."
      />

      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        required
        fullWidth
        margin="normal"
        helperText="At least 8 characters."
      />

      <PasswordField
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        required
        fullWidth
        margin="normal"
      />

      {state.error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isPending}
        sx={{ mt: 3 }}
      >
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Create school account"}
      </Button>
    </Box>
  );
}
