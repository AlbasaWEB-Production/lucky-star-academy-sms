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

import { updateStudentAction } from "@/lib/actions/roster";
import { initialFormResult } from "@/lib/actions/result";
import PasswordField from "@/components/auth/PasswordField";

/**
 * Edits a student.
 *
 * Changing the roll number also rewrites the student's synthetic login
 * address, which the update action handles alongside this form.
 */
export default function EditStudentForm({
  student,
  classes,
}: {
  student: { id: string; fullName: string; rollNumber: number; classId: string };
  classes: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(updateStudentAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      <input type="hidden" name="studentId" value={student.id} />

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
        defaultValue={student.fullName}
        required
        fullWidth
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
          defaultValue={student.rollNumber}
          required
          fullWidth
          margin="none"
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />

        <TextField
          name="classId"
          label="Class"
          select
          required
          fullWidth
          margin="none"
          defaultValue={student.classId}
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
