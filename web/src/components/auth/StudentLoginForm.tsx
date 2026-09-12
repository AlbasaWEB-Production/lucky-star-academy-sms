"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { signInAsStudentAction } from "@/lib/auth/actions";
import { initialAuthFormState } from "@/lib/auth/form-state";
import PasswordField from "./PasswordField";

/**
 * Student sign-in by roll number and name.
 *
 * Keeps the original three-field form. What changed is what happens behind it:
 * the server resolves (roll number, name) to the student's synthetic email
 * address and completes a real Supabase Auth sign-in, so the student gets a
 * verified session and genuinely scoped database access - instead of the old
 * behaviour of storing a role in localStorage.
 */
export default function StudentLoginForm() {
  const [state, formAction, isPending] = useActionState(
    signInAsStudentAction,
    initialAuthFormState,
  );

  return (
    <Box component="form" action={formAction} noValidate>
      <TextField
        name="rollNumber"
        label="Roll number"
        type="number"
        required
        fullWidth
        autoFocus
        margin="normal"
        slotProps={{ htmlInput: { min: 1, step: 1 } }}
      />

      <TextField
        name="studentName"
        label="Your name"
        autoComplete="name"
        required
        fullWidth
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
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Sign in"}
      </Button>
    </Box>
  );
}
