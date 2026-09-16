import { Box, Paper, TableCell, TableRow, Typography } from "@mui/material";

import AttendancePieChart from "@/components/charts/AttendancePieChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
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
export default async function StudentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

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

  const filteredSummary = query
    ? summary.filter((entry) => entry.subjectName.toLowerCase().includes(query))
    : summary;

  const searchedRecords = query
    ? records.filter((record) =>
        [record.subjectName, record.status].some((field) =>
          (field ?? "").toLowerCase().includes(query),
        ),
      )
    : records;

  const recentRecords = searchedRecords.slice(0, RECORD_LIMIT);

  const present = summary.reduce((total, entry) => total + entry.present, 0);
  const absent = summary.reduce((total, entry) => total + entry.absent, 0);
  const recorded = present + absent;
  const overallPercentage = recorded > 0 ? Math.round((present / recorded) * 1000) / 10 : 0;

  const summaryEmptyMessage =
    query && summary.length > 0
      ? `Nothing matches “${q}”.`
      : "No attendance has been recorded for you yet.";

  const recordsCaption = query
    ? `${recentRecords.length} matching record${recentRecords.length === 1 ? "" : "s"}, newest first.`
    : records.length > RECORD_LIMIT
      ? `The ${RECORD_LIMIT} most recent of ${records.length} records, newest first.`
      : `${records.length} record${records.length === 1 ? "" : "s"}, newest first.`;

  const recordsEmptyMessage =
    query && records.length > 0
      ? `Nothing matches “${q}”.`
      : "No attendance records yet.";

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

      <SearchBar placeholder="Search by subject or status" initialQuery={q} />

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
          <Typography variant="overline" color="text.secondary">
            Overview
          </Typography>
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
            columnAlign={["left", "right", "right", "right", "right"]}
            isEmpty={filteredSummary.length === 0}
            emptyMessage={summaryEmptyMessage}
          >
            {filteredSummary.map((entry) => (
              <TableRow key={entry.subjectId}>
                <TableCell>{entry.subjectName}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {entry.present}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {entry.absent}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {entry.total}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {entry.percentage}%
                </TableCell>
              </TableRow>
            ))}
          </TableShell>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Recent records
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {recordsCaption}
      </Typography>

      <TableShell
        headers={["Date", "Subject", "Status"]}
        isEmpty={recentRecords.length === 0}
        emptyMessage={recordsEmptyMessage}
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
