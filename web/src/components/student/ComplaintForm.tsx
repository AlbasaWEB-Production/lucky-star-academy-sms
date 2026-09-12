"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { createComplaintAction } from "@/lib/actions/content";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Files a complaint as the signed-in student.
 *
 * There is deliberately no student field: `createComplaintAction` takes the
 * author from the session, and the insert policy pins `student_id` to
 * `auth.uid()`, so a complaint can never be filed in someone else's name.
 *
 * The action revalidates the page and returns `succeed` instead of redirecting,
 * so submitting leaves the form on screen with a confirmation. The list of
 * previous complaints below the form is server-rendered and therefore refreshes
 * the next time the page is navigated to, not in place.
 *
 * `today` is computed by the server page and passed in, so the date field's
 * default is identical during server rendering and hydration.
 */
export default function ComplaintForm({ today }: { today: string }) {
  const [state, formAction, isPending] = useActionState(createComplaintAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      <TextField
        name="complaint"
        label="Your complaint"
        required
        fullWidth
        multiline
        minRows={4}
        margin="normal"
        autoFocus
        helperText="Describe what happened. Your school office reviews complaints."
      />

      <TextField
        name="date"
        label="Date"
        type="date"
        fullWidth
        margin="normal"
        defaultValue={today}
        slotProps={{ inputLabel: { shrink: true } }}
        helperText="Optional - defaults to today."
      />

      {state.error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      {state.ok ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          Your complaint has been submitted. It appears in the list below the next time this page
          loads.
        </Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Submit complaint"}
      </Button>
    </Box>
  );
}
