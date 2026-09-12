"use client";

import { useActionState, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

import { initialFormResult, type FormActionResult } from "@/lib/actions/result";

/**
 * Destructive-action button with a confirmation dialog and inline error
 * reporting.
 *
 * The action is passed in as a prop. Server actions are serializable
 * references, so a Server Component can hand one to this client component
 * without violating the "no functions across the boundary" rule.
 */
export default function ConfirmActionButton({
  action,
  fields,
  label,
  confirmTitle,
  confirmMessage,
  color = "error",
  variant = "outlined",
  size = "small",
  successMessage,
}: {
  action: (previous: FormActionResult, formData: FormData) => Promise<FormActionResult>;
  fields: Record<string, string>;
  label: string;
  confirmTitle: string;
  confirmMessage: string;
  color?: "error" | "primary" | "inherit" | "secondary" | "success" | "info" | "warning";
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
  successMessage?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialFormResult);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button color={color} variant={variant} size={size} onClick={() => setOpen(true)}>
        {label}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirmTitle}</DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: state.error || state.ok ? 2 : 0 }}>
            {confirmMessage}
          </DialogContentText>

          {state.error ? <Alert severity="error">{state.error}</Alert> : null}
          {state.ok && successMessage ? (
            <Alert severity="success">{successMessage}</Alert>
          ) : null}

          <form action={formAction} id={`confirm-${label.replace(/\s+/g, "-").toLowerCase()}`}>
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
          </form>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            type="submit"
            color={color}
            variant="contained"
            disabled={isPending}
            form={`confirm-${label.replace(/\s+/g, "-").toLowerCase()}`}
          >
            {isPending ? "Working..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
