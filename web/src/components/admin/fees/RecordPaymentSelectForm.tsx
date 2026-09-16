"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { recordPaymentAction } from "@/lib/actions/finance";
import { initialFormResult } from "@/lib/actions/result";
import type { FormOption } from "./FeeStructureForm";

/**
 * Records a fee payment for a pupil the bursar picks from the term's
 * assessments.
 *
 * The assessment is a select (each option is a pupil in the term), so the
 * bursar can record a payment straight from the payments ledger without
 * leaving it. The amount and method are typed; the receipt number is generated
 * in the database, never typed here. When the page was reached from an
 * assessment's "Record payment" link, `initialAssessment` preselects that
 * pupil so a following-through bursar does not re-pick them.
 */
export default function RecordPaymentSelectForm({
  assessments,
  initialAssessment = "",
}: {
  assessments: FormOption[];
  initialAssessment?: string;
}) {
  const [state, formAction, isPending] = useActionState(recordPaymentAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <TextField
        select
        fullWidth
        margin="normal"
        name="assessmentId"
        label="Pupil"
        required
        defaultValue={initialAssessment}
      >
        <option value="" disabled>
          Choose a pupil
        </option>
        {assessments.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </TextField>

      <TextField
        fullWidth
        margin="normal"
        name="amount"
        label="Amount received (GH¢)"
        required
        autoFocus
        helperText="Entered in cedis, for example 180.50, and stored in pesewas."
        inputMode="decimal"
      />

      <TextField select fullWidth margin="normal" name="method" label="Method" required defaultValue="">
        <option value="" disabled>
          Choose a method
        </option>
        <option value="cash">Cash</option>
        <option value="mobile_money">Mobile money</option>
        <option value="bank">Bank</option>
      </TextField>

      <TextField
        fullWidth
        margin="normal"
        name="paymentDate"
        label="Payment date"
        type="date"
        slotProps={{ inputLabel: { shrink: true } }}
        helperText="Leave empty to use today."
      />

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Record payment"}
      </Button>
    </Box>
  );
}
