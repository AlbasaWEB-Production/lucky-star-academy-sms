"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";

import { createSubjectAction, updateSubjectAction } from "@/lib/actions/roster";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Creates or edits a subject.
 *
 * One component covers both routes because the fields are identical - only the
 * action and the pre-filled values change. The legacy app had a separate
 * `SubjectForm` that could add several subjects at once and no edit screen at
 * all; here the teacher is chosen on the form instead of afterwards, because
 * `subjects.teacher_id` is the only place the link lives.
 */
export default function SubjectForm({
  classes,
  teachers,
  subject,
}: {
  classes: { id: string; name: string }[];
  teachers: { id: string; fullName: string }[];
  subject?: {
    id: string;
    name: string;
    code: string;
    sessions: string;
    classId: string;
    teacherId: string | null;
  };
}) {
  const [state, formAction, isPending] = useActionState(
    subject ? updateSubjectAction : createSubjectAction,
    initialFormResult,
  );

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {subject ? <input type="hidden" name="subjectId" value={subject.id} /> : null}

      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <Typography variant="overline" color="text.secondary">
        Subject details
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <TextField
          name="subjectName"
          label="Subject name"
          defaultValue={subject?.name ?? ""}
          required
          fullWidth
          autoFocus
          margin="none"
        />

        <TextField
          name="subjectCode"
          label="Subject code"
          defaultValue={subject?.code ?? ""}
          required
          fullWidth
          margin="none"
          helperText="Unique within the class, for example MATH-10."
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <TextField
          name="sessions"
          label="Sessions"
          type="number"
          defaultValue={subject?.sessions ?? ""}
          required
          fullWidth
          margin="none"
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
          helperText="How many periods the subject runs for."
        />

        <TextField
          name="classId"
          label="Class"
          select
          required
          fullWidth
          margin="none"
          defaultValue={subject?.classId ?? ""}
          helperText={classes.length === 0 ? "There are no classes yet." : undefined}
        >
          {classes.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Typography variant="overline" color="text.secondary" sx={{ mt: 3 }}>
        Teacher
      </Typography>

      <TextField
        name="teacherId"
        label="Teacher"
        select
        fullWidth
        margin="normal"
        defaultValue={subject?.teacherId ?? ""}
        helperText="Optional. A subject without a teacher can be assigned later."
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
          There are no teachers yet, so this subject will be created unassigned. You can add a
          teacher from the Teachers page.
        </Alert>
      ) : null}

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isPending || classes.length === 0}
        sx={{ mt: 3 }}
      >
        {isPending ? (
          <CircularProgress size={24} color="inherit" />
        ) : subject ? (
          "Save changes"
        ) : (
          "Add subject"
        )}
      </Button>
    </Box>
  );
}
