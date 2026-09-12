"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  fetchSubjectAttendanceAction,
  saveSubjectAttendanceAction,
} from "@/lib/actions/records";
import { initialFormResult } from "@/lib/actions/result";
import type { StudentSummary } from "@/lib/data/queries";

export type MarkableSubject = {
  id: string;
  name: string;
  code: string;
  classId: string;
  className: string;
};

type Status = "Present" | "Absent";

/**
 * Attendance marking screen, shared by the admin and teacher portals.
 *
 * Both roles use this same component: the subject list differs (an admin sees
 * every subject, a teacher only theirs) because it is built from an
 * RLS-scoped read, and the write policies stop a teacher from posting to a
 * colleague's subject.
 *
 * All students visible to the caller are passed in once and filtered by class
 * in the browser, so changing subject or date does not re-render the server
 * tree. Existing records for the chosen day are fetched with a Server Action
 * and pre-selected, which makes correcting a mistake a re-submit rather than a
 * duplicate - the table has a unique (student, subject, date) constraint and
 * the action upserts.
 */
export default function AttendanceMarker({
  subjects,
  students,
}: {
  subjects: MarkableSubject[];
  students: StudentSummary[];
}) {
  const [state, formAction, isPending] = useActionState(
    saveSubjectAttendanceAction,
    initialFormResult,
  );

  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const subject = useMemo(
    () => subjects.find((item) => item.id === subjectId) ?? null,
    [subjects, subjectId],
  );

  const roster = useMemo(() => {
    if (!subject) {
      return [];
    }
    return students
      .filter((student) => student.classId === subject.classId)
      .sort((a, b) => a.rollNumber - b.rollNumber);
  }, [students, subject]);

  // Load whatever is already recorded for the chosen subject and day.
  useEffect(() => {
    if (!subject || !date) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    fetchSubjectAttendanceAction(subject.id, date)
      .then((existing) => {
        if (cancelled) {
          return;
        }

        const next: Record<string, Status> = {};
        // Default everyone to Present, then apply what is on record. Most days
        // everyone is present, so this saves the common case.
        for (const student of students.filter((s) => s.classId === subject.classId)) {
          next[student.id] = "Present";
        }
        for (const row of existing) {
          next[row.studentId] = row.status;
        }
        setStatuses(next);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Could not load existing attendance. You can still record it.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [subject, date, students]);

  const entries = JSON.stringify(
    roster.map((student) => ({
      studentId: student.id,
      status: statuses[student.id] ?? "Present",
    })),
  );

  const setAll = (status: Status) => {
    const next: Record<string, Status> = {};
    for (const student of roster) {
      next[student.id] = status;
    }
    setStatuses(next);
  };

  if (subjects.length === 0) {
    return (
      <Alert severity="info">
        There are no subjects available to you yet. A subject must exist and, for teachers, be
        assigned to you before attendance can be recorded.
      </Alert>
    );
  }

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
          }}
        >
          <TextField
            label="Subject"
            select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
          >
            {subjects.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name} - {option.className}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>

        {subject ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {roster.length} student{roster.length === 1 ? "" : "s"} in {subject.className}.
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Choose a subject to load its class list.
          </Typography>
        )}
      </Paper>

      {loadError ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      {subject ? (
        <Box component="form" action={formAction}>
          <input type="hidden" name="subjectId" value={subject.id} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="entries" value={entries} />

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button size="small" variant="outlined" onClick={() => setAll("Present")}>
              Mark all present
            </Button>
            <Button size="small" variant="outlined" onClick={() => setAll("Absent")}>
              Mark all absent
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Roll no.</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ py: 4, textAlign: "center" }}>
                      <CircularProgress size={22} />
                    </TableCell>
                  </TableRow>
                ) : roster.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ py: 4, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        This class has no students yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  roster.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>
                        <RadioGroup
                          row
                          value={statuses[student.id] ?? "Present"}
                          onChange={(event) =>
                            setStatuses((current) => ({
                              ...current,
                              [student.id]: event.target.value as Status,
                            }))
                          }
                        >
                          <FormControlLabel value="Present" control={<Radio size="small" />} label="Present" />
                          <FormControlLabel value="Absent" control={<Radio size="small" />} label="Absent" />
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {state.error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {state.error}
            </Alert>
          ) : null}

          {state.ok ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Attendance saved.
            </Alert>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isPending || roster.length === 0}
            sx={{ mt: 3 }}
          >
            {isPending ? <CircularProgress size={24} color="inherit" /> : "Save attendance"}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
