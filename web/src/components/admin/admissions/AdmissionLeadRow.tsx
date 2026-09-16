"use client";

import { useActionState } from "react";
import { Alert, Box, Button, MenuItem, TextField, TableCell, TableRow, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { advanceAdmissionAction, deleteAdmissionAction } from "@/lib/actions/admissions";
import { initialFormResult } from "@/lib/actions/result";
import { isTerminalStage, nextStage, stageLabel } from "@/lib/admissions";
import type { AdmissionLead } from "@/lib/data/admissions";
import type { FormOption } from "./AdmissionForm";

/**
 * One admissions lead in the record table, with the control to advance it to
 * its next stage (and, when that stage is `enrolled`, a class selector) and a
 * delete button for a lead the admin no longer wants to track.
 *
 * Advancing stamps the next stage date and the matching milestone column. A
 * lead at `enrolled` or `declined` offers no advance — it has reached a state
 * that does not move forward.
 */
export default function AdmissionLeadRow({
  lead,
  classes,
}: {
  lead: AdmissionLead;
  classes: FormOption[];
}) {
  const [advanceState, advanceAction, advancePending] = useActionState(
    advanceAdmissionAction,
    initialFormResult,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAdmissionAction,
    initialFormResult,
  );

  const next = nextStage(lead.stage);
  const terminal = isTerminalStage(lead.stage);

  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {lead.pupilName}
        </Typography>
        {lead.className ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {lead.className}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>
        {lead.guardianName ?? "—"}
        {lead.guardianPhone ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {lead.guardianPhone}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>{lead.source ?? "—"}</TableCell>
      <TableCell>{lead.intakeTerm.name ?? "—"}</TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {stageLabel(lead.stage)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          since {lead.stageDate}
        </Typography>
      </TableCell>
      <TableCell>
        {terminal ? (
          <Typography variant="caption" color="text.secondary">
            Final
          </Typography>
        ) : (
          <Box component="form" action={advanceAction} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <input type="hidden" name="admissionId" value={lead.id} />
            <input type="hidden" name="nextStage" value={next ?? ""} />
            {advanceState.error ? (
              <Alert severity="error" sx={{ mb: 1, width: "100%" }}>
                {advanceState.error}
              </Alert>
            ) : null}
            {next === "enrolled" ? (
              <TextField
                select
                size="small"
                name="classId"
                label="Class enrolled into"
                defaultValue=""
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">Choose a class</MenuItem>
                {classes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            <Button type="submit" variant="outlined" size="small" disabled={advancePending}>
              Advance to {stageLabel(next ?? "")}
            </Button>
          </Box>
        )}

        <Box component="form" action={deleteAction} sx={{ display: "inline", mt: terminal ? 0 : 1 }}>
          <input type="hidden" name="admissionId" value={lead.id} />
          {deleteState.error ? (
            <Alert severity="error" sx={{ mb: 1, mt: 1 }}>
              {deleteState.error}
            </Alert>
          ) : null}
          <Button
            component="button"
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
