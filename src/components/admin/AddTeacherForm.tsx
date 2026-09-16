"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";

import PasswordField from "@/components/auth/PasswordField";
import { createTeacherAction } from "@/lib/actions/roster";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Creates a teacher.
 *
 * A teacher signs in with a real email address, so a Supabase Auth user is
 * created from these fields - that is why a password is collected here and
 * nowhere else. The legacy form could only be reached from a subject and always
 * bound the new teacher to that subject's class; here the subject link is
 * optional, and the subject (not the teacher) stores it.
 */
export default function AddTeacherForm({
  subjects,
}: {
  subjects: { id: string; name: string; className: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createTeacherAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
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
          required
          fullWidth
          autoFocus
          margin="none"
        />

        <TextField
          name="email"
          label="Email address"
          type="email"
          required
          fullWidth
          margin="none"
          helperText="The teacher signs in with this address."
        />
      </Box>

      <Typography variant="overline" color="text.secondary" sx={{ mt: 3 }}>
        Login
      </Typography>

      <PasswordField
        name="password"
        label="Temporary password"
        required
        fullWidth
        margin="normal"
        helperText="At least 8 characters. Share it with the teacher."
      />

      <Typography variant="overline" color="text.secondary" sx={{ mt: 3 }}>
        Assignment
      </Typography>

      <TextField
        name="subjectId"
        label="Assign to subject"
        select
        fullWidth
        margin="normal"
        defaultValue=""
        helperText={
          subjects.length === 0
            ? "Every subject already has a teacher."
            : "Optional. The teacher can be given more subjects later."
        }
      >
        <MenuItem value="">No subject yet</MenuItem>
        {subjects.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.name} - {option.className}
          </MenuItem>
        ))}
      </TextField>

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Add teacher"}
      </Button>
    </Box>
  );
}
