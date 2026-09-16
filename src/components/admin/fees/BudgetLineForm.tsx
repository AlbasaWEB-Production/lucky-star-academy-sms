"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { createBudgetLineAction } from "@/lib/actions/finance";
import { initialFormResult } from "@/lib/actions/result";
import { COST_CENTRE_OPTIONS } from "./costCentres";
import type { FormOption } from "./FeeStructureForm";

/**
 * Adds a budget line: how much a cost centre is allowed to spend in a term.
 *
 * The comparison the budget screen draws is "budgeted versus actual", so a
 * line is the budget, and the expenses screen records the spending that is
 * measured against it. A term and a cost centre can hold several lines of
 * different descriptions — for example "Teaching: textbooks" and "Teaching:
 * stationery" — each with its own budget.
 */
export default function BudgetLineForm({ terms }: { terms: FormOption[] }) {
  const [state, formAction, isPending] = useActionState(createBudgetLineAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

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

      <TextField select fullWidth margin="normal" name="costCentre" label="Cost centre" required defaultValue="">
        <option value="" disabled>
          Choose a cost centre
        </option>
        {COST_CENTRE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </TextField>

      <TextField
        fullWidth
        margin="normal"
        name="description"
        label="Description"
        required
        helperText="For example: Textbooks and stationery."
      />

      <TextField
        fullWidth
        margin="normal"
        name="budgetAmount"
        label="Budget amount (GH¢)"
        required
        helperText="Entered in cedis, for example 2500.00, and stored in pesewas."
        inputMode="decimal"
      />

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Add budget line"}
      </Button>
    </Box>
  );
}
