"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { fetchSubjectMarksAction, saveSubjectMarksAction } from "@/lib/actions/records";
import { initialFormResult } from "@/lib/actions/result";
import type { StudentSummary } from "@/lib/data/queries";
import type { MarkableSubject } from "./AttendanceMarker";

/**
 * Exam mark entry, shared by the admin and teacher portals.
 *
 * Same shape as AttendanceMarker: the subject list is RLS-scoped, existing
 * marks are fetched on selection, and saving upserts on
 * (student, subject) so re-entering a subject corrects rather than duplicates.
 */
export default function MarksEntryForm({
  subjects,
  students,
}: {
  subjects: MarkableSubject[];
  students: StudentSummary[];
}) {
  const [state, formAction, isPending] = useActionState(saveSubjectMarksAction, initialFormResult);

  const [subjectId, setSubjectId] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
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

  useEffect(() => {
    if (!subject) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    fetchSubjectMarksAction(subject.id)
      .then((existing) => {
        if (cancelled) {
          return;
        }

        const byStudent = new Map(existing.map((row) => [row.studentId, row.marks]));
        const next: Record<string, string> = {};
        for (const student of students.filter((s) => s.classId === subject.classId)) {
          const value = byStudent.get(student.id);
          // Blank means "no marks yet", which keeps ungraded students distinct
          // from a genuine zero.
          next[student.id] = value === undefined ? "" : String(value);
        }
        setMarks(next);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Could not load existing marks. You can still record them.");
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
  }, [subject, students]);

  // Only students with a value are submitted, so leaving a field blank never
  // overwrites a mark with zero.
  const entries = JSON.stringify(
    roster
      .filter((student) => (marks[student.id] ?? "").trim() !== "")
      .map((student) => ({
        studentId: student.id,
        marks: Number(marks[student.id]),
      })),
  );

  const filledCount = roster.filter((student) => (marks[student.id] ?? "").trim() !== "").length;

  if (subjects.length === 0) {
    return (
      <Alert severity="info">
        There are no subjects available to you yet. A subject must exist and, for teachers, be
        assigned to you before marks can be recorded.
      </Alert>
    );
  }

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Subject
        </Typography>
        <TextField
          label="Subject"
          select
          fullWidth
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
        >
          {subjects.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.name} - {option.className}
            </MenuItem>
          ))}
        </TextField>

        {subject ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {roster.length} student{roster.length === 1 ? "" : "s"} in {subject.className}.
            {" "}Leave a field blank to skip that student.
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
          <input type="hidden" name="entries" value={entries} />

          {state.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {state.error}
            </Alert>
          ) : null}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Roll no.</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell sx={{ width: 180 }}>Marks obtained</TableCell>
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
                        <TextField
                          type="number"
                          size="small"
                          value={marks[student.id] ?? ""}
                          onChange={(event) =>
                            setMarks((current) => ({
                              ...current,
                              [student.id]: event.target.value,
                            }))
                          }
                          slotProps={{ htmlInput: { min: 0, step: "0.5" } }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {state.ok ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Marks saved.
            </Alert>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isPending || filledCount === 0}
            sx={{ mt: 3 }}
          >
            {isPending ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `Save marks${filledCount > 0 ? ` (${filledCount})` : ""}`
            )}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
