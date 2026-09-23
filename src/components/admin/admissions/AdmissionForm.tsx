"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, TextField } from "@mui/material";

import { createAdmissionAction } from "@/lib/actions/admissions";
import { initialFormResult } from "@/lib/actions/result";

export type FormOption = { value: string; label: string };

/**
 * Records a new admissions lead.
 *
 * A lead always starts at `enquiry` with received-on today — a prospect is an
 * enquiry before it is anything else. The intake term is the term the pupil is
 * expected to start; it stays optional because a parent can enquire without a
 * fixed start date yet.
 */
export default function AdmissionForm({ terms }: { terms: FormOption[] }) {
  const [state, formAction, isPending] = useActionState(createAdmissionAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <TextField
        fullWidth
        margin="normal"
        name="pupilName"
        label="Pupil name"
        required
        helperText="The name of the child joining the school."
      />

      <TextField
        fullWidth
        margin="normal"
        name="guardianName"
        label="Guardian name"
        helperText="Optional. The parent or guardian to reach."
      />

      <TextField
        fullWidth
        margin="normal"
        name="guardianPhone"
        label="Guardian phone"
        helperText="Optional. Used to follow up on the enquiry."
      />

      <TextField
        fullWidth
        margin="normal"
        name="source"
        label="Source"
        helperText="Where the enquiry came from, for example Walk-in or Referral. Optional."
      />

      <TextField select fullWidth margin="normal" name="intakeTermId" label="Intake term" defaultValue="">
        <MenuItem value="">No term yet</MenuItem>
        {terms.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Record lead"}
      </Button>
    </Box>
  );
}
