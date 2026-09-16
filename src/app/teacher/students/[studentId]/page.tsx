import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import AttendancePieChart from "@/components/charts/AttendancePieChart";
import MarksBarChart from "@/components/charts/MarksBarChart";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import {
  getStudentById,
  listExamResultsForStudent,
  summariseAttendanceForStudent,
} from "@/lib/data/queries";

export const metadata = {
  title: "Student details",
};

/**
 * One student, read-only.
 *
 * Two layers decide what appears:
 *
 *   - `getStudentById` reads the RLS-scoped `student_directory`, so a student
 *     outside this teacher's classes comes back as null and the page 404s,
 *     which is the same answer as a student that does not exist.
 *   - `listExamResultsForStudent` and `summariseAttendanceForStudent` are
 *     limited by policy to subjects this teacher teaches, so the marks and
 *     attendance shown here are already the teacher's own subjects.
 *
 * The percentage maths is done by `summariseAttendanceForStudent` on the
 * server, replacing the browser-side `attendanceCalculator.js`.
 */
export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  await requireRoleWithTenant("teacher");

  const student = await getStudentById(studentId);

  if (!student) {
    notFound();
  }

  const [marks, attendanceSummary] = await Promise.all([
    listExamResultsForStudent(studentId),
    summariseAttendanceForStudent(studentId),
  ]);

  const totals = attendanceSummary.reduce(
    (running, entry) => ({
      present: running.present + entry.present,
      absent: running.absent + entry.absent,
    }),
    { present: 0, absent: 0 },
  );

  const recorded = totals.present + totals.absent;
  const overallPercentage = recorded > 0 ? Math.round((totals.present / recorded) * 1000) / 10 : 0;

  return (
    <>
      <PageHeader
        title={student.fullName}
        subtitle={`Roll number ${student.rollNumber} - ${student.className}`}
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button component={Link} href="/teacher/attendance" variant="contained">
              Take attendance
            </Button>
            <Button component={Link} href="/teacher/students" variant="outlined">
              Back to students
            </Button>
          </Box>
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
          alignItems: "start",
          mb: 3,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Details
          </Typography>

          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{student.fullName}</Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Roll number
            </Typography>
            <Typography variant="body1">{student.rollNumber}</Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Class
            </Typography>
            <Typography variant="body1">{student.className}</Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Email
            </Typography>
            <Typography variant="body1">{student.email ?? "Not set"}</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Student records are maintained by your school administrator.
          </Typography>
        </Paper>

        <Box sx={{ display: "grid", gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Overview
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Attendance in your subjects
            </Typography>
            <AttendancePieChart present={totals.present} absent={totals.absent} height={240} />
            {recorded > 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {overallPercentage}% of {recorded} recorded session
                {recorded === 1 ? "" : "s"} attended.
              </Typography>
            ) : null}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Performance
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Marks in your subjects
            </Typography>
            <MarksBarChart
              data={marks.map((entry) => ({ name: entry.subjectName, value: entry.marksObtained }))}
              height={240}
            />
          </Paper>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Attendance by subject
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TableShell
          headers={["Subject", "Present", "Absent", "Total", "Attendance"]}
          columnAlign={["left", "right", "right", "right", "right"]}
          density="compact"
          isEmpty={attendanceSummary.length === 0}
          emptyMessage="No attendance has been recorded for this student in your subjects yet."
        >
          {attendanceSummary.map((entry) => (
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

      <Typography variant="h6" sx={{ mb: 2 }}>
        Exam marks
      </Typography>

      <TableShell
        headers={["Subject", "Code", "Marks obtained"]}
        columnAlign={["left", "left", "right"]}
        density="compact"
        isEmpty={marks.length === 0}
        emptyMessage="No marks have been recorded for this student in your subjects yet."
      >
        {marks.map((entry) => (
          <TableRow key={entry.subjectId}>
            <TableCell>{entry.subjectName}</TableCell>
            <TableCell>{entry.subjectCode}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {entry.marksObtained}
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
