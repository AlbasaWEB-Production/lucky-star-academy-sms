"use client";

import { useActionState } from "react";
import { Alert, Box, Button, CircularProgress, TextField, Typography } from "@mui/material";

import { initialFormResult } from "@/lib/actions/result";
import { createTimetableSlotAction } from "@/lib/actions/timetable";
import { PERIODS, WEEKDAYS } from "./weekdays";

/**
 * Places one subject into the week.
 *
 * Only the subject, the day and the period are asked for: the class and the
 * teacher of the lesson come from the subject row, so choosing them here would
 * create a second answer that could disagree with the first.
 *
 * There is no redirect after placing a lesson: the action stays put and
 * revalidates, so the week in view (and the class filter over it) is the one
 * that gains the new slot. The fields keep what was chosen, because placing the
 * same subject on a second day is the common next step.
 */
export default function AddTimetableSlotForm({
  subjects,
}: {
  /** Every subject in the school, already ordered by class then name. */
  subjects: { id: string; name: string; code: string; className: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createTimetableSlotAction, initialFormResult);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <Typography variant="overline" color="text.secondary">
        Lesson
      </Typography>

      <TextField
        select
        name="subjectId"
        label="Subject"
        required
        fullWidth
        margin="none"
        defaultValue=""
        slotProps={{ select: { native: true } }}
        helperText="The class and the teacher are taken from the subject, so they are never chosen here."
      >
        <option value="" disabled>
          Choose a subject
        </option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {`${subject.className} · ${subject.name} (${subject.code})`}
          </option>
        ))}
      </TextField>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, mt: 2 }}>
        <TextField
          select
          name="dayOfWeek"
          label="Day"
          required
          fullWidth
          margin="none"
          defaultValue=""
          slotProps={{ select: { native: true } }}
        >
          <option value="" disabled>
            Choose a day
          </option>
          {WEEKDAYS.map((day, index) => (
            <option key={day} value={index + 1}>
              {day}
            </option>
          ))}
        </TextField>

        <TextField
          select
          name="period"
          label="Period"
          required
          fullWidth
          margin="none"
          defaultValue=""
          slotProps={{ select: { native: true } }}
        >
          <option value="" disabled>
            Choose a period
          </option>
          {PERIODS.map((period) => (
            <option key={period} value={period}>
              {`Period ${period}`}
            </option>
          ))}
        </TextField>
      </Box>

      <TextField
        name="room"
        label="Room"
        fullWidth
        margin="normal"
        helperText="Optional. A room cannot host two lessons at the same time, so a taken room is reported back here."
      />

      {state.ok ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          The lesson is in the week.
        </Alert>
      ) : null}

      <Button type="submit" variant="contained" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Place lesson"}
      </Button>
    </Box>
  );
}
