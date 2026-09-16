"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { signInWithEmailAction } from "@/lib/auth/actions";
import { initialAuthFormState } from "@/lib/auth/form-state";
import PasswordField from "./PasswordField";

/**
 * Email + password sign-in for admins and teachers.
 *
 * Uses `useActionState`, so the form posts to a Server Action and works
 * without JavaScript at all - the credential check never runs in the browser.
 */
export default function LoginForm({ role }: { role: "admin" | "teacher" }) {
  const [state, formAction, isPending] = useActionState(
    signInWithEmailAction,
    initialAuthFormState,
  );

  return (
    <Box component="form" action={formAction} noValidate>
      <input type="hidden" name="role" value={role} />

      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <TextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        fullWidth
        autoFocus
        margin="normal"
      />

      <PasswordField
        name="password"
        label="Password"
        autoComplete="current-password"
        required
        fullWidth
        margin="normal"
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isPending}
        sx={{ mt: 3 }}
      >
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Sign in"}
      </Button>
    </Box>
  );
}
