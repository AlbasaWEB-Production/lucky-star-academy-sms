import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import AttendancePieChart from "@/components/charts/AttendancePieChart";
import MarksBarChart from "@/components/charts/MarksBarChart";
import EditStudentForm from "@/components/admin/EditStudentForm";
import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { removeStudentSubjectAttendanceAction } from "@/lib/actions/records";
import {
  getStudentById,
  listAttendanceForStudent,
  listClasses,
  listExamResultsForStudent,
  summariseAttendanceForStudent,
} from "@/lib/data/queries";

export const metadata = {
  title: "Student details",
};

/**
 * Next.js 16 hands route params in as a Promise, so they must be awaited.
 */
export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const [student, classes] = await Promise.all([getStudentById(studentId), listClasses()]);

  if (!student) {
    notFound();
  }

  const [marks, attendanceSummary, attendanceRecords] = await Promise.all([
    listExamResultsForStudent(studentId),
    summariseAttendanceForStudent(studentId),
    listAttendanceForStudent(studentId),
  ]);

  const present = attendanceRecords.filter((record) => record.status === "Present").length;
  const absent = attendanceRecords.length - present;

  return (
    <>
      <PageHeader
        title={student.fullName}
        subtitle={`Roll number ${student.rollNumber} - ${student.className}`}
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button component={Link} href={`/admin/progress/${student.id}`} variant="contained">
              View progress
            </Button>
            <Button component={Link} href="/admin/students" variant="outlined">
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
          <EditStudentForm student={student} classes={classes} />
        </Paper>

        <Box sx={{ display: "grid", gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Overview
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Attendance overall
            </Typography>
            <AttendancePieChart present={present} absent={absent} height={240} />
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Performance
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Marks by subject
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
          headers={["Subject", "Present", "Absent", "Attendance", ""]}
          columnAlign={["left", "right", "right", "right", undefined]}
          density="compact"
          isEmpty={attendanceSummary.length === 0}
          emptyMessage="No attendance has been recorded for this student yet."
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
                {entry.percentage}%
              </TableCell>
              <TableCell>
                <ConfirmActionButton
                  action={removeStudentSubjectAttendanceAction}
                  fields={{ studentId: student.id, subjectId: entry.subjectId }}
                  label="Clear"
                  confirmTitle="Clear this subject's attendance?"
                  confirmMessage={`All ${entry.total} attendance records for ${entry.subjectName} will be deleted for ${student.fullName}.`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableShell>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Exam marks
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TableShell
          headers={["Subject", "Code", "Marks obtained"]}
          columnAlign={["left", "left", "right"]}
          density="compact"
          isEmpty={marks.length === 0}
          emptyMessage="No marks have been recorded for this student yet."
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
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent attendance records
      </Typography>

      <TableShell
        headers={["Date", "Subject", "Status"]}
        density="compact"
        isEmpty={attendanceRecords.length === 0}
        emptyMessage="No attendance records yet."
      >
        {attendanceRecords.slice(0, 25).map((record) => (
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
