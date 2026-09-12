import { Box, Paper, TableCell, TableRow, Typography } from "@mui/material";

import AttendancePieChart from "@/components/charts/AttendancePieChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import {
  getOwnStudentRecord,
  listAttendanceForStudent,
  summariseAttendanceForStudent,
} from "@/lib/data/queries";

export const metadata = {
  title: "My attendance",
};

/**
 * How many individual records the detail table lists.
 *
 * A full school year of per-subject attendance runs into the hundreds, and the
 * legacy page nested every one of them inside an expandable row. The summary
 * above carries the complete picture, so only the most recent slice is listed
 * here - and the page says so.
 */
const RECORD_LIMIT = 50;

/**
 * Attendance, grouped by subject.
 *
 * The percentages are not recomputed here: `summariseAttendanceForStudent()`
 * replaced the browser-side `attendanceCalculator.js` from the legacy app and
 * returns the per-subject totals already.
 */
export default async function StudentAttendancePage() {
  const session = await requireRoleWithTenant("student");
  const student = await getOwnStudentRecord(session.id);

  if (!student) {
    return (
      <>
        <PageHeader title="My attendance" />
        <EmptyState
          title="Your student record is not ready yet"
          description="Your login works, but no student record is linked to it, so there is no attendance to show. Ask your school office to complete your enrolment, then sign in again."
        />
      </>
    );
  }

  const [summary, records] = await Promise.all([
    summariseAttendanceForStudent(session.id),
    listAttendanceForStudent(session.id),
  ]);

  const present = summary.reduce((total, entry) => total + entry.present, 0);
  const absent = summary.reduce((total, entry) => total + entry.absent, 0);
  const recorded = present + absent;
  const overallPercentage = recorded > 0 ? Math.round((present / recorded) * 1000) / 10 : 0;

  const recentRecords = records.slice(0, RECORD_LIMIT);

  return (
    <>
      <PageHeader
        title="My attendance"
        subtitle={
          recorded > 0
            ? `${overallPercentage}% across ${recorded} recorded session${recorded === 1 ? "" : "s"}.`
            : "No attendance has been recorded for you yet."
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "2fr 3fr" },
          alignItems: "start",
          mb: 4,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Present vs absent
          </Typography>
          <AttendancePieChart present={present} absent={absent} height={300} />
        </Paper>

        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Attendance by subject
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Present, absent and total sessions are counted from the records your teachers saved.
          </Typography>

          <TableShell
            headers={["Subject", "Present", "Absent", "Total", "Attendance"]}
            isEmpty={summary.length === 0}
            emptyMessage="No attendance has been recorded for you yet."
          >
            {summary.map((entry) => (
              <TableRow key={entry.subjectId}>
                <TableCell>{entry.subjectName}</TableCell>
                <TableCell>{entry.present}</TableCell>
                <TableCell>{entry.absent}</TableCell>
                <TableCell>{entry.total}</TableCell>
                <TableCell>{entry.percentage}%</TableCell>
              </TableRow>
            ))}
          </TableShell>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Recent records
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {records.length > RECORD_LIMIT
          ? `The ${RECORD_LIMIT} most recent of ${records.length} records, newest first.`
          : `${records.length} record${records.length === 1 ? "" : "s"}, newest first.`}
      </Typography>

      <TableShell
        headers={["Date", "Subject", "Status"]}
        isEmpty={recentRecords.length === 0}
        emptyMessage="No attendance records yet."
      >
        {recentRecords.map((record) => (
          <TableRow key={record.id}>
            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
            <TableCell>{record.subjectName}</TableCell>
            <TableCell>{record.status}</TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
