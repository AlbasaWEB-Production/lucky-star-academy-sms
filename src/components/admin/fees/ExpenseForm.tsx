"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { createExpenseAction } from "@/lib/actions/finance";
import { initialFormResult } from "@/lib/actions/result";
import { COST_CENTRE_OPTIONS } from "./costCentres";
import type { FormOption } from "./FeeStructureForm";

/**
 * Records an expense against a term and a cost centre.
 *
 * An expense is the actual spending the budget screen compares against its
 * line. The cost centre comes from the same fixed list a budget line uses, so
 * an expense always lands somewhere a budget can measure it.
 */
export default function ExpenseForm({ terms }: { terms: FormOption[] }) {
  const [state, formAction, isPending] = useActionState(createExpenseAction, initialFormResult);

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
        helperText="For example: Repaired the classroom roof."
      />

      <TextField
        fullWidth
        margin="normal"
        name="amount"
        label="Amount (GH¢)"
        required
        helperText="Entered in cedis, for example 350.00, and stored in pesewas."
        inputMode="decimal"
      />

      <TextField
        fullWidth
        margin="normal"
        name="expenseDate"
        label="Expense date"
        type="date"
        slotProps={{ inputLabel: { shrink: true } }}
        helperText="Leave empty to use today."
      />

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Record expense"}
      </Button>
    </Box>
  );
}
