import { Chip, TableCell, TableRow, Typography } from "@mui/material";

import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { listIncidents } from "@/lib/data/welfare";
import { incidentTypeLabel } from "@/lib/incidents";

export const metadata = {
  title: "Incidents",
};

/**
 * Incidents for the classes the teacher teaches, read-only.
 *
 * The scoping is done by Row Level Security (`incidents_select_by_teacher`
 * allows only rows in a class the teacher teaches), so this page adds no class
 * filter of its own. Unlike the admin register there is no record/resolve/delete
 * here — the incident register is admin-only, and a teacher sees incidents only
 * to stay informed about the children in their classes.
 */
export default async function TeacherIncidentsPage() {
  await requireRoleWithTenant("teacher");

  const incidents = await listIncidents();
  const openIncidents = incidents.filter((incident) => !incident.resolved).length;

  const subtitle =
    incidents.length > 0
      ? `${incidents.length} incident${incidents.length === 1 ? "" : "s"} in the classes you teach, ${openIncidents} still open.`
      : "No incidents recorded in the classes you teach.";

  return (
    <>
      <PageHeader title="Incidents" subtitle={subtitle} />

      <TableShell
        headers={["Pupil", "Class", "Date", "Type", "Note", "Status"]}
        density="compact"
        isEmpty={incidents.length === 0}
        emptyMessage="No incidents recorded in the classes you teach yet. The register is maintained by an administrator."
      >
        {incidents.map((incident) => (
          <TableRow key={incident.id}>
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
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
