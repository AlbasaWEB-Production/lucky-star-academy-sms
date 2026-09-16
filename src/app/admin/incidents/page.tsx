import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";

import IncidentForm, { type IncidentStudentOption } from "@/components/admin/incidents/IncidentForm";
import IncidentRow from "@/components/admin/incidents/IncidentRow";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { listIncidents } from "@/lib/data/welfare";
import { listStudents } from "@/lib/data/queries";

export const metadata = {
  title: "Incidents",
};

/**
 * The admin-only behavioural incident register.
 *
 * Records an incident against a pupil, resolves it once the matter is closed,
 * or deletes a record the admin no longer wants on the register. RLS on
 * `incidents` grants admins full CRUD; a teacher reads incidents only in the
 * classes they teach and a pupil only their own — neither can write. The note
 * is short and factual: the form does not prompt for health, family or home
 * circumstances.
 */
export default async function IncidentsPage() {
  await requireRoleWithTenant("admin");

  const [incidents, students] = await Promise.all([listIncidents(), listStudents()]);

  const studentOptions: IncidentStudentOption[] = students.map((student) => ({
    value: student.id,
    label: `${student.className} · ${student.fullName} (roll ${student.rollNumber})`,
    classId: student.classId,
  }));

  const openIncidents = incidents.filter((incident) => !incident.resolved).length;

  const subtitle =
    incidents.length > 0
      ? `${incidents.length} incident${incidents.length === 1 ? "" : "s"} recorded, ${openIncidents} still open.`
      : "No incidents recorded. Record the first one below, then resolve it once the matter is closed.";

  return (
    <>
      <PageHeader
        title="Incidents"
        subtitle={subtitle}
        action={
          <Button component={Link} href="/admin/analytics/welfare" variant="outlined">
            View welfare analytics
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Record an incident</Typography>
          <Typography variant="caption" color="text.secondary">
            An incident starts open. Resolve it once the matter is closed — the by-type and
            per-hundred charts read from these records.
          </Typography>
        </Box>
        <IncidentForm students={studentOptions} />
      </Paper>

      <TableShell
        headers={["Pupil", "Class", "Date", "Type", "Note", "Status", "Actions"]}
        density="compact"
        isEmpty={incidents.length === 0}
        emptyMessage="No incidents recorded. Record the first incident above."
      >
        {incidents.map((incident) => (
          <IncidentRow key={incident.id} incident={incident} />
        ))}
      </TableShell>
    </>
  );
}
