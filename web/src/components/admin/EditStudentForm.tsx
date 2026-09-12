"use client";

import { useActionState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
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
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 520 }}>
      <input type="hidden" name="studentId" value={student.id} />

      <TextField
        name="fullName"
        label="Student name"
        defaultValue={student.fullName}
        required
        fullWidth
        margin="normal"
      />

      <TextField
        name="rollNumber"
        label="Roll number"
        type="number"
        defaultValue={student.rollNumber}
        required
        fullWidth
        margin="normal"
        slotProps={{ htmlInput: { min: 1, step: 1 } }}
      />

      <TextField
        name="classId"
        label="Class"
        select
        required
        fullWidth
        margin="normal"
        defaultValue={student.classId}
      >
        {classes.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.name}
          </MenuItem>
        ))}
      </TextField>

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
