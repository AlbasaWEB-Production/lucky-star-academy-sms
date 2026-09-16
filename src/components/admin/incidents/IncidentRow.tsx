"use client";

import { useActionState } from "react";
import { Alert, Box, Button, Chip, TableCell, TableRow, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";

import { deleteIncidentAction, resolveIncidentAction } from "@/lib/actions/incidents";
import { incidentTypeLabel } from "@/lib/incidents";
import { initialFormResult } from "@/lib/actions/result";
import type { Incident } from "@/lib/data/welfare";

/**
 * One behavioural incident in the register, with the controls to resolve it or
 * to remove it altogether.
 *
 * `resolve` closes the incident and stamps the day it was resolved (in the
 * server action, not here). `delete` removes a record the admin no longer wants
 * on the register. Both are admin-only — the server action re-checks the role
 * and RLS would refuse a teacher write anyway.
 */
export default function IncidentRow({ incident }: { incident: Incident }) {
  const [resolveState, resolveAction, resolvePending] = useActionState(
    resolveIncidentAction,
    initialFormResult,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteIncidentAction,
    initialFormResult,
  );

  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {incident.studentName}
        </Typography>
        {incident.rollNumber !== null ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            Roll no. {incident.rollNumber}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>
        {incident.className ?? "—"}
        {incident.campus ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {incident.campus}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>{incident.date}</TableCell>
      <TableCell>
        <Typography variant="body2">{incidentTypeLabel(incident.incidentType)}</Typography>
      </TableCell>
      <TableCell>{incident.note ?? "—"}</TableCell>
      <TableCell>
        {incident.resolved ? (
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={`Resolved${incident.resolvedOn ? ` ${incident.resolvedOn}` : ""}`}
          />
        ) : (
          <Chip size="small" color="error" variant="outlined" label="Open" />
        )}
      </TableCell>
      <TableCell>
        {!incident.resolved ? (
          <Box component="form" action={resolveAction} sx={{ display: "inline", mr: 1 }}>
            <input type="hidden" name="incidentId" value={incident.id} />
            {resolveState.error ? (
              <Alert severity="error" sx={{ mb: 1 }}>
                {resolveState.error}
              </Alert>
            ) : null}
            <Button
              type="submit"
              variant="outlined"
              size="small"
              startIcon={<CheckIcon />}
              disabled={resolvePending}
              sx={{ textTransform: "none" }}
            >
              Resolve
            </Button>
          </Box>
        ) : null}

        <Box component="form" action={deleteAction} sx={{ display: "inline" }}>
          <input type="hidden" name="incidentId" value={incident.id} />
          {deleteState.error ? (
            <Alert severity="error" sx={{ mb: 1, mt: 1 }}>
              {deleteState.error}
            </Alert>
          ) : null}
          <Button
            type="submit"
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={deletePending}
            sx={{ textTransform: "none" }}
          >
            Delete
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
}
