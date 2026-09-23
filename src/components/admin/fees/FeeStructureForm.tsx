"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, TextField } from "@mui/material";

import { createFeeStructureAction } from "@/lib/actions/finance";
import { initialFormResult } from "@/lib/actions/result";

export type FormOption = { value: string; label: string };

/**
 * Adds a fee structure: one amount a class's pupils owe for a term, under a
 * description (for example "Termly fees"). A class can carry several structures
 * for one term and a pupil's assessment is the sum of them, so the description
 * is what tells them apart.
 */
export default function FeeStructureForm({
  classes,
  terms,
}: {
  classes: FormOption[];
  terms: FormOption[];
}) {
  const [state, formAction, isPending] = useActionState(createFeeStructureAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <TextField select fullWidth margin="normal" name="classId" label="Class" required defaultValue="">
        <MenuItem value="" disabled>
          Choose a class
        </MenuItem>
        {classes.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField select fullWidth margin="normal" name="termId" label="Term" required defaultValue="">
        <MenuItem value="" disabled>
          Choose a term
        </MenuItem>
        {terms.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        margin="normal"
        name="description"
        label="Description"
        required
        helperText="For example: Termly fees."
      />

      <TextField
        fullWidth
        margin="normal"
        name="amount"
        label="Amount (GH¢)"
        required
        helperText="Money is entered in cedis, for example 180.50, and stored in pesewas."
        inputMode="decimal"
      />

      <TextField
        fullWidth
        margin="normal"
        name="dueDate"
        label="Due date"
        type="date"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Add fee structure"}
      </Button>
    </Box>
  );
}
