"use client";

import { useState, useActionState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, TextField } from "@mui/material";

import { assignTeacherAction } from "@/lib/actions/roster";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Assigns, changes or clears the teacher for one subject.
 *
 * "Unassigned" submits an empty `teacherId`, which the action turns into a
 * NULL teacher_id. In the legacy schema the link ran the other way - the
 * teacher document held `teachSubject` - so re-assigning a subject meant
 * editing the teacher. Here it is an edit on the subject.
 */
export default function AssignTeacherForm({
  subjectId,
  teachers,
  currentTeacherId,
}: {
  subjectId: string;
  teachers: { id: string; fullName: string }[];
  currentTeacherId: string | null;
}) {
  const [state, formAction, isPending] = useActionState(assignTeacherAction, initialFormResult);
  const [teacherId, setTeacherId] = useState(currentTeacherId ?? "");

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      <input type="hidden" name="subjectId" value={subjectId} />

      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <TextField
        name="teacherId"
        label="Assigned teacher"
        select
        fullWidth
        margin="normal"
        value={teacherId}
        onChange={(event) => setTeacherId(event.target.value)}
        helperText="Choose Unassigned to leave the subject without a teacher."
      >
        <MenuItem value="">Unassigned</MenuItem>
        {teachers.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.fullName}
          </MenuItem>
        ))}
      </TextField>

      {teachers.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          There are no teachers in this school yet. Add one from the Teachers page first.
        </Alert>
      ) : null}

      {state.ok ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          Teacher assignment saved.
        </Alert>
      ) : null}

      <Button
        type="submit"
        variant="contained"
        disabled={isPending || teachers.length === 0}
        sx={{ mt: 3 }}
      >
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Save"}
      </Button>
    </Box>
  );
}
