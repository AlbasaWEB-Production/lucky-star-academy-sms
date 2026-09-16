"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { generateAssessmentsAction } from "@/lib/actions/finance";
import { initialFormResult } from "@/lib/actions/result";
import type { FormOption } from "./FeeStructureForm";

/**
 * Generates one fee assessment per pupil in a class for a term.
 *
 * Each assessment is the sum of that class's fee structures for the term, so
 * running the form after adding structures turns them into a bill for every
 * pupil. Pupils who already have an assessment for the term are left alone, so
 * re-running it never duplicates a bill. It deliberately takes a class and a
 * term rather than "everything at once" — a school adds structures a class at a
 * time, and a whole-term sweep would be a much bigger, harder-to-review action.
 */
export default function GenerateAssessmentsForm({
  classes,
  terms,
}: {
  classes: FormOption[];
  terms: FormOption[];
}) {
  const [state, formAction, isPending] = useActionState(generateAssessmentsAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <TextField select fullWidth margin="normal" name="classId" label="Class" required defaultValue="">
        <option value="" disabled>
          Choose a class
        </option>
        {classes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </TextField>

      <TextField select fullWidth margin="normal" name="termId" label="Term" required defaultValue="">
        <option value="" disabled>
          Choose a term
        </option>
        {terms.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </TextField>

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Generate assessments"}
      </Button>
    </Box>
  );
}
