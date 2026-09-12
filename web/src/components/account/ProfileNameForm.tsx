"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { updateOwnNameAction } from "@/lib/actions/profile";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Renames the signed-in user. Shared by all three portals.
 *
 * Writes only to the caller's own `profiles` row; the RLS self-update policy
 * pins `role` and `school_id` to the JWT, so this cannot be used to gain
 * privileges. Email addresses are not editable here - they are an identity
 * change and belong to the admin provisioning flows.
 */
export default function ProfileNameForm({ currentName }: { currentName: string }) {
  const [state, formAction, isPending] = useActionState(updateOwnNameAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 480 }}>
      <TextField
        name="fullName"
        label="Full name"
        defaultValue={currentName}
        required
        fullWidth
        margin="normal"
      />

      {state.error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      {state.ok ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          Your name has been updated.
        </Alert>
      ) : null}

      <Button type="submit" variant="contained" disabled={isPending} sx={{ mt: 2 }}>
        {isPending ? <CircularProgress size={22} color="inherit" /> : "Save name"}
      </Button>
    </Box>
  );
}
