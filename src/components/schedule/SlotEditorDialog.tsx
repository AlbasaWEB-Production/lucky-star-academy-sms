"use client";

import { useActionState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import { initialFormResult } from "@/lib/actions/result";
import { deleteTimetableSlotAction, updateTimetableSlotAction } from "@/lib/actions/timetable";
import type { TimetableSlotSummary } from "@/lib/data/timetable";
import { PERIODS, WEEKDAYS, weekdayName } from "./weekdays";

/**
 * The editor for one lesson: move it, or take it out of the week.
 *
 * The dialog is driven by the slot it is handed rather than by its own `open`
 * flag, so it closes by itself when the lesson it is showing stops existing -
 * after a delete the grid re-renders without the row and this returns null. The
 * subject is deliberately not editable: a lesson belongs to the subject that
 * carries its class and teacher, and changing that is a different lesson.
 *
 * Note the type-only import of `TimetableSlotSummary` from a `server-only`
 * module: it is erased at compile time, so the client bundle never reaches the
 * server-side read layer. `CalendarGrid` does the same with `CalendarDay`.
 */
export default function SlotEditorDialog({
  slot,
  onClose,
}: {
  /** The lesson being edited, or null when no cell is open. */
  slot: TimetableSlotSummary | null;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateTimetableSlotAction, initialFormResult);

  if (!slot) {
    return null;
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{slot.subjectName}</DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {`${slot.className} · ${weekdayName(slot.dayOfWeek)}, period ${slot.period}`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {slot.teacherName ?? "No teacher assigned to this subject yet"}
        </Typography>

        <Box component="form" action={formAction} noValidate sx={{ mt: 3 }}>
          {state.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {state.error}
            </Alert>
          ) : null}

          <input type="hidden" name="slotId" value={slot.id} />

          <Typography variant="overline" color="text.secondary">
            Move this lesson
          </Typography>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, mt: 1 }}>
            <TextField
              select
              name="dayOfWeek"
              label="Day"
              required
              fullWidth
              margin="none"
              defaultValue={String(slot.dayOfWeek)}
              slotProps={{ select: { native: true } }}
            >
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
              defaultValue={String(slot.period)}
              slotProps={{ select: { native: true } }}
            >
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
            defaultValue={slot.room ?? ""}
            helperText="Leave empty if no room has been arranged yet."
          />

          {state.ok ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              The lesson has been saved. The grid behind this dialog is already up to date.
            </Alert>
          ) : null}

          <Button type="submit" variant="contained" disabled={isPending} sx={{ mt: 3 }}>
            {isPending ? <CircularProgress size={24} color="inherit" /> : "Save changes"}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <ConfirmActionButton
          action={deleteTimetableSlotAction}
          fields={{ slotId: slot.id }}
          label="Delete lesson"
          confirmTitle="Remove this lesson?"
          confirmMessage={`${slot.subjectName} will be taken out of ${weekdayName(slot.dayOfWeek)}, period ${slot.period}. The subject itself is not deleted - only its place in the week.`}
          successMessage="Removed from the week."
        />
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
