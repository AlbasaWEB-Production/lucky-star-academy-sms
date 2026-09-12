"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { updateClassAction } from "@/lib/actions/roster";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Renames a class from its detail page.
 *
 * The action redirects back to the class list on success, which is also where
 * the delete button on the same page sends the admin.
 */
export default function EditClassForm({
  classRecord,
}: {
  classRecord: { id: string; name: string };
}) {
  const [state, formAction, isPending] = useActionState(updateClassAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 520 }}>
      <input type="hidden" name="classId" value={classRecord.id} />

      <TextField
        name="className"
        label="Class name"
        defaultValue={classRecord.name}
        required
        fullWidth
        margin="normal"
      />

      {state.error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Save changes"}
      </Button>
    </Box>
  );
}
