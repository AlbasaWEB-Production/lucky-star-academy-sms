"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField, Typography } from "@mui/material";

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
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      <input type="hidden" name="teacherId" value={teacher.id} />

      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <Typography variant="overline" color="text.secondary">
        Teacher details
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <TextField
          name="fullName"
          label="Teacher name"
          defaultValue={teacher.fullName}
          required
          fullWidth
          margin="none"
        />

        <TextField
          label="Email address"
          defaultValue={teacher.email ?? "No login address"}
          fullWidth
          margin="none"
          disabled
          helperText="The sign-in address cannot be changed here."
        />
      </Box>

      <Typography variant="overline" color="text.secondary" sx={{ mt: 3 }}>
        Login
      </Typography>

      <PasswordField
        name="password"
        label="New password"
        fullWidth
        margin="normal"
        helperText="Leave blank to keep the current password."
      />

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Save changes"}
      </Button>
    </Box>
  );
}
