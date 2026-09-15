"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { createClassAction } from "@/lib/actions/roster";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Creates a class.
 *
 * The legacy screen asked only for a name, and so does this one - the class is
 * scoped to the admin's school by the action rather than by the form.
 */
export default function AddClassForm() {
  const [state, formAction, isPending] = useActionState(createClassAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <TextField
        name="className"
        label="Class name"
        required
        fullWidth
        autoFocus
        margin="normal"
        helperText="For example: Class 10 A."
      />

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Create class"}
      </Button>
    </Box>
  );
}
