"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

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
 *
 * The roster is a grid of one tile per pupil rather than a table of radio
 * pairs. Taking a register is a bulk operation with a lopsided distribution -
 * on a normal day everyone is present and a handful are not - so the default
 * is Present for all and the interaction is tapping the few who are absent.
 * That is two taps for a class of forty instead of forty. The bulk buttons and
 * Save live in a bar pinned to the bottom of the viewport, so they stay
 * reachable without scrolling back up a long class list.
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

  const presentCount = roster.filter(
    (student) => (statuses[student.id] ?? "Present") === "Present",
  ).length;
  const absentCount = roster.length - presentCount;

  const setAll = (status: Status) => {
    const next: Record<string, Status> = {};
    for (const student of roster) {
      next[student.id] = status;
    }
    setStatuses(next);
  };

  const toggle = (studentId: string) => {
    setStatuses((current) => ({
      ...current,
      [studentId]: (current[studentId] ?? "Present") === "Present" ? "Absent" : "Present",
    }));
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
            {roster.length} student{roster.length === 1 ? "" : "s"} in {subject.className}. Tap a
            pupil to mark them absent.
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

          {isLoading ? (
            <Paper variant="outlined" sx={{ py: 6, display: "grid", placeItems: "center" }}>
              <CircularProgress size={26} />
            </Paper>
          ) : roster.length === 0 ? (
            <Paper variant="outlined" sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                This class has no students yet.
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                  md: "repeat(4, 1fr)",
                  lg: "repeat(5, 1fr)",
                },
              }}
            >
              {roster.map((student) => {
                const status = statuses[student.id] ?? "Present";
                const isPresent = status === "Present";

                return (
                  <Box
                    key={student.id}
                    component="button"
                    type="button"
                    onClick={() => toggle(student.id)}
                    aria-pressed={!isPresent}
                    aria-label={`${student.fullName}, roll number ${student.rollNumber}, currently ${status.toLowerCase()}. Activate to mark ${isPresent ? "absent" : "present"}.`}
                    sx={{
                      appearance: "none",
                      font: "inherit",
                      textAlign: "center",
                      cursor: "pointer",
                      p: 2,
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: isPresent ? "success.main" : "error.main",
                      backgroundColor: isPresent
                        ? "rgba(46, 125, 50, 0.08)"
                        : "rgba(198, 40, 40, 0.08)",
                      transition: "border-color 120ms ease, background-color 120ms ease",
                      "&:hover": {
                        backgroundColor: isPresent
                          ? "rgba(46, 125, 50, 0.16)"
                          : "rgba(198, 40, 40, 0.16)",
                      },
                      "&:focus-visible": {
                        outline: "3px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        mx: "auto",
                        mb: 1,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#fff",
                        backgroundColor: isPresent ? "success.main" : "error.main",
                      }}
                    >
                      {initials(student.fullName)}
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        lineHeight: 1.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {student.fullName}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      Roll {student.rollNumber}
                    </Typography>

                    <Box
                      sx={{
                        mt: 0.75,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: isPresent ? "success.main" : "error.main",
                      }}
                    >
                      {isPresent ? (
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 16 }} />
                      )}
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {status}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}

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

          {/*
            Pinned to the bottom of the viewport so the register stays
            submittable from anywhere in a long class list. `type="button"` on
            the bulk actions is load-bearing: a <button> inside a <form>
            defaults to type="submit", so without it these posted the register
            instead of setting the statuses.
          */}
          <Paper
            variant="outlined"
            sx={{
              position: "sticky",
              bottom: 0,
              zIndex: 2,
              mt: 3,
              p: 2,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1.5,
              backgroundColor: "background.paper",
              boxShadow: "0 -6px 18px rgba(8, 62, 40, 0.08)",
            }}
          >
            <Button
              type="button"
              size="small"
              variant="outlined"
              color="success"
              disabled={roster.length === 0}
              onClick={() => setAll("Present")}
            >
              Mark all present
            </Button>
            <Button
              type="button"
              size="small"
              variant="outlined"
              color="error"
              disabled={roster.length === 0}
              onClick={() => setAll("Absent")}
            >
              Mark all absent
            </Button>

            <Box sx={{ display: "flex", gap: 1, ml: { sm: 1 } }}>
              <Chip size="small" color="success" variant="outlined" label={`${presentCount} present`} />
              <Chip size="small" color="error" variant="outlined" label={`${absentCount} absent`} />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              type="submit"
              variant="contained"
              disabled={isPending || roster.length === 0}
              sx={{ minWidth: 168 }}
            >
              {isPending ? <CircularProgress size={22} color="inherit" /> : "Save attendance"}
            </Button>
          </Paper>
        </Box>
      ) : null}
    </Box>
  );
}

/** First letters of the first and last name parts, e.g. "Abdul Rahman Musah" -> "AM". */
function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return (first + last).toUpperCase();
}
