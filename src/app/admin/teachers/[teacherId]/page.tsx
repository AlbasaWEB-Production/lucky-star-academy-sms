import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import EditTeacherForm from "@/components/admin/EditTeacherForm";
import TeacherAttendanceForm from "@/components/admin/TeacherAttendanceForm";
import AttendancePieChart from "@/components/charts/AttendancePieChart";
import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { deleteTeacherAction } from "@/lib/actions/roster";
import { getTeacherById, listTeacherAttendance } from "@/lib/data/queries";

export const metadata = {
  title: "Teacher details",
};

/** Today, as `YYYY-MM-DD`, resolved on the server so the form cannot disagree. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Next.js 16 hands route params in as a Promise, so they must be awaited.
 *
 * A teacher has no single class or subject: every assignment is a subject row
 * that points at this teacher, so all of them are listed. Deleting the teacher
 * leaves those subjects in place but unassigned.
 */
export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;

  const teacher = await getTeacherById(teacherId);

  if (!teacher) {
    notFound();
  }

  const attendance = await listTeacherAttendance(teacherId);

  const latest = attendance[0] ?? null;
  const presentTotal = attendance.reduce((sum, record) => sum + record.presentCount, 0);
  const absentTotal = attendance.reduce((sum, record) => sum + record.absentCount, 0);

  return (
    <>
      <PageHeader
        title={teacher.fullName}
        subtitle={teacher.email ?? "No login address"}
        action={
          <Button component={Link} href="/admin/teachers" variant="outlined">
            Back to teachers
          </Button>
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
          alignItems: "start",
          mb: 4,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Details
          </Typography>
          <EditTeacherForm teacher={teacher} />

          <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
            Danger zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Deleting a teacher removes their login. Their subjects stay, but become unassigned, and
            their attendance history goes with them.
          </Typography>
          <ConfirmActionButton
            action={deleteTeacherAction}
            fields={{ teacherId: teacher.id }}
            label="Delete teacher"
            confirmTitle="Delete this teacher?"
            confirmMessage={`${teacher.fullName}'s login and attendance history will be permanently removed. Their ${teacher.assignments.length} subject${teacher.assignments.length === 1 ? "" : "s"} will stay in place but become unassigned. This cannot be undone.`}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Record attendance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {latest
              ? `Pre-filled from the most recent entry, ${new Date(latest.date).toLocaleDateString()}. Saving an existing date updates it.`
              : "No attendance has been recorded for this teacher yet."}
          </Typography>
          <TeacherAttendanceForm
            teacherId={teacher.id}
            defaultDate={latest?.date ?? today()}
            defaultPresentCount={latest?.presentCount ?? 0}
            defaultAbsentCount={latest?.absentCount ?? 0}
          />
        </Paper>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Assignments
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TableShell
          headers={["Subject", "Code", "Class", "Actions"]}
          density="compact"
          isEmpty={teacher.assignments.length === 0}
          emptyMessage="This teacher has no subjects yet. Assign one from a subject's page."
        >
          {teacher.assignments.map((assignment) => (
            <TableRow key={assignment.subjectId}>
              <TableCell>{assignment.subjectName}</TableCell>
              <TableCell>{assignment.subjectCode}</TableCell>
              <TableCell>{assignment.className}</TableCell>
              <TableCell>
                <Button
                  component={Link}
                  href={`/admin/subjects/${assignment.subjectId}`}
                  size="small"
                  variant="outlined"
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Teacher attendance
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
          alignItems: "start",
        }}
      >
        <TableShell
          headers={["Date", "Present", "Absent", "Total"]}
          columnAlign={["left", "right", "right", "right"]}
          density="compact"
          isEmpty={attendance.length === 0}
          emptyMessage="No attendance recorded yet. Use the form above to record it for a date."
        >
          {attendance.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {record.presentCount}
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {record.absentCount}
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {record.presentCount + record.absentCount}
              </TableCell>
            </TableRow>
          ))}
        </TableShell>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Overview
          </Typography>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Attendance overall
          </Typography>
          <AttendancePieChart present={presentTotal} absent={absentTotal} height={240} />
        </Paper>
      </Box>
    </>
  );
}
