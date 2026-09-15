"use client";

import { useActionState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { createStudentAction } from "@/lib/actions/roster";
import { initialFormResult } from "@/lib/actions/result";
import PasswordField from "@/components/auth/PasswordField";

/**
 * Creates a student.
 *
 * The roll number is what the student will sign in with, and the login address
 * is derived from it on the server, so there is no email field here.
 */
export default function AddStudentForm({
  classes,
}: {
  classes: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createStudentAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <Typography variant="overline" color="text.secondary">
        Student details
      </Typography>

      <TextField
        name="fullName"
        label="Student name"
        required
        fullWidth
        autoFocus
        margin="normal"
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <TextField
          name="rollNumber"
          label="Roll number"
          type="number"
          required
          fullWidth
          margin="none"
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
          helperText="The student signs in with this number and their name."
        />

        <TextField
          name="classId"
          label="Class"
          select
          required
          fullWidth
          margin="none"
          defaultValue=""
        >
          {classes.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
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
        helperText="At least 8 characters. Share it with the student."
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isPending}
        sx={{ mt: 3 }}
      >
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Add student"}
      </Button>
    </Box>
  );
}
