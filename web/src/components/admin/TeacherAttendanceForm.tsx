"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";

import { saveTeacherAttendanceAction } from "@/lib/actions/roster";
import { initialFormResult } from "@/lib/actions/result";

/**
 * Records a teacher's attendance for one date.
 *
 * The action upserts on (teacher_id, date), so re-submitting an existing date
 * corrects the counts instead of failing. `defaultDate` is resolved on the
 * server so the pre-filled value cannot disagree with the server render.
 */
export default function TeacherAttendanceForm({
  teacherId,
  defaultDate,
  defaultPresentCount = 0,
  defaultAbsentCount = 0,
}: {
  teacherId: string;
  defaultDate: string;
  defaultPresentCount?: number;
  defaultAbsentCount?: number;
}) {
  const [state, formAction, isPending] = useActionState(
    saveTeacherAttendanceAction,
    initialFormResult,
  );

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      <input type="hidden" name="teacherId" value={teacherId} />

      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <TextField
        name="date"
        label="Date"
        type="date"
        defaultValue={defaultDate}
        required
        fullWidth
        margin="normal"
        sx={{ maxWidth: 240 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <TextField
          name="presentCount"
          label="Present"
          type="number"
          defaultValue={defaultPresentCount}
          required
          fullWidth
          margin="none"
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />

        <TextField
          name="absentCount"
          label="Absent"
          type="number"
          defaultValue={defaultAbsentCount}
          required
          fullWidth
          margin="none"
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />
      </Box>

      {state.ok ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          Attendance saved.
        </Alert>
      ) : null}

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Save attendance"}
      </Button>
    </Box>
  );
}
