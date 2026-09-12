"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import PasswordField from "@/components/auth/PasswordField";
import { updateTeacherAction } from "@/lib/actions/roster";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Edits a teacher's name, and optionally resets their password.
 *
 * The email address is the Supabase Auth identity, so it is shown as
 * read-only text rather than an editable field. There is no stored password to
 * display anywhere - blank means "leave it alone".
 */
export default function EditTeacherForm({
  teacher,
}: {
  teacher: { id: string; fullName: string; email: string | null };
}) {
  const [state, formAction, isPending] = useActionState(updateTeacherAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 520 }}>
      <input type="hidden" name="teacherId" value={teacher.id} />

      <TextField
        name="fullName"
        label="Teacher name"
        defaultValue={teacher.fullName}
        required
        fullWidth
        margin="normal"
      />

      <TextField
        label="Email address"
        defaultValue={teacher.email ?? "No login address"}
        fullWidth
        margin="normal"
        disabled
        helperText="The sign-in address cannot be changed here."
      />

      <PasswordField
        name="password"
        label="New password"
        fullWidth
        margin="normal"
        helperText="Leave blank to keep the current password."
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
