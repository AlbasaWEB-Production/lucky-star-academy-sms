"use client";

import { useActionState, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, TextField } from "@mui/material";

import { createIncidentAction } from "@/lib/actions/incidents";
import { INCIDENT_TYPES, incidentTypeLabel } from "@/lib/incidents";
import { initialFormResult } from "@/lib/actions/result";

/** A pupil the admin can record an incident against, carrying its class. */
export type IncidentStudentOption = {
  value: string;
  label: string;
  classId: string;
};

/** A dated incident record: pick the pupil, the type, and a short factual note. */
export default function IncidentForm({ students }: { students: IncidentStudentOption[] }) {
  const [state, formAction, isPending] = useActionState(createIncidentAction, initialFormResult);

  // The pupil select carries the class as a hidden field, so the register gets
  // both `studentId` and `classId` without the admin choosing a mismatched pair.
  const [classId, setClassId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Box component="form" action={formAction} noValidate sx={{ maxWidth: 560 }}>
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <input type="hidden" name="classId" value={classId} />

      <TextField
        select
        fullWidth
        margin="normal"
        name="studentId"
        label="Pupil"
        required
        value={studentId}
        onChange={(event) => {
          const value = event.target.value;
          setStudentId(value);
          const selected = students.find((option) => option.value === value);
          setClassId(selected?.classId ?? "");
        }}
        helperText="Choose the pupil and their class is taken automatically."
      >
        <MenuItem value="">Choose a pupil</MenuItem>
        {students.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        margin="normal"
        name="incidentType"
        label="Incident type"
        required
        defaultValue=""
        helperText="A closed set — choose the type that best fits."
      >
        <MenuItem value="">Choose a type</MenuItem>
        {INCIDENT_TYPES.map((type) => (
          <MenuItem key={type} value={type}>
            {incidentTypeLabel(type)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        margin="normal"
        name="note"
        label="Short note"
        multiline
        minRows={2}
        helperText="Keep it short and factual — the form does not prompt for health, family or home circumstances."
      />

      <TextField
        fullWidth
        margin="normal"
        name="date"
        label="Incident date"
        type="date"
        defaultValue={today}
        helperText="Defaults to today. Change it only if the incident took place earlier."
        slotProps={{ htmlInput: { max: today } }}
      />

      <Button type="submit" variant="contained" size="large" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? <CircularProgress size={24} color="inherit" /> : "Record incident"}
      </Button>
    </Box>
  );
}
