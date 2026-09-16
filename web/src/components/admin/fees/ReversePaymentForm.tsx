"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { reversePaymentAction } from "@/lib/actions/finance";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Reverses an earlier payment.
 *
 * A payment is never deleted — the audit trail holds, so the compensation is a
 * second record marked as a reversal that points back at the original. The
 * reason is mandatory (three characters or more) because the whole point of a
 * reversal is to say *why* money moved back. The form carries the payment id as
 * a hidden field and the bursar types only the reason.
 */
export default function ReversePaymentForm({ paymentId }: { paymentId: string }) {
  const [state, formAction, isPending] = useActionState(reversePaymentAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <input type="hidden" name="paymentId" value={paymentId} />

      <TextField
        fullWidth
        margin="normal"
        name="reversalReason"
        label="Reason for reversing"
        required
        autoFocus
        multiline
        minRows={2}
        helperText="For example: duplicate entry, or the payment was recorded against the wrong pupil."
      />

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Reverse payment"}
      </Button>
    </Box>
  );
}
