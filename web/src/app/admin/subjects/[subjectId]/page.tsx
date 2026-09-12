import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import AssignTeacherForm from "@/components/admin/AssignTeacherForm";
import SubjectForm from "@/components/admin/SubjectForm";
import AttendancePieChart from "@/components/charts/AttendancePieChart";
import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { deleteSubjectAction } from "@/lib/actions/roster";
import {
  getSubjectById,
  getSubjectRoster,
  listClasses,
  listTeachers,
} from "@/lib/data/queries";

export const metadata = {
  title: "Subject details",
};

/**
 * Next.js 16 hands route params in as a Promise, so they must be awaited.
 *
 * The roster combines each student's marks and attendance for this subject.
 * `getSubjectRoster` does that in three queries regardless of class size; the
 * per-student alternative would be 2N round trips for one page render.
 */
export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const subject = await getSubjectById(subjectId);

  if (!subject) {
    notFound();
  }

  const [roster, teachers, classes] = await Promise.all([
    getSubjectRoster(subjectId, subject.classId),
    listTeachers(),
    listClasses(),
  ]);

  const students = roster.map((row) => row.student);

  const presentTotal = roster.reduce((sum, row) => sum + row.present, 0);
  const absentTotal = roster.reduce((sum, row) => sum + row.absent, 0);
  const graded = roster.filter((row) => row.marksObtained !== null);
  const averageMarks =
    graded.length > 0
      ? Math.round(
          (graded.reduce((sum, row) => sum + (row.marksObtained ?? 0), 0) / graded.length) * 10,
        ) / 10
      : null;

  return (
    <>
      <PageHeader
        title={subject.name}
        subtitle={`${subject.code} - ${subject.className} - ${students.length} student${students.length === 1 ? "" : "s"}`}
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button component={Link} href={`/admin/classes/${subject.classId}`} variant="outlined">
              View class
            </Button>
            <Button component={Link} href="/admin/subjects" variant="outlined">
              Back to subjects
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
          mb: 4,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Details
          </Typography>
          <SubjectForm classes={classes} teachers={teachers} subject={subject} />
        </Paper>

        <Box sx={{ display: "grid", gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Assigned teacher
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {subject.teacherName
                ? `${subject.teacherName} teaches this subject.`
                : "Nobody teaches this subject yet. Pick a teacher below."}
            </Typography>
            <AssignTeacherForm
              subjectId={subject.id}
              teachers={teachers}
              currentTeacherId={subject.teacherId}
            />
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Danger zone
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Deleting a subject removes its attendance and exam records too.
            </Typography>
            <ConfirmActionButton
              action={deleteSubjectAction}
              fields={{ subjectId: subject.id }}
              label="Delete subject"
              confirmTitle="Delete this subject?"
              confirmMessage={`${subject.name} (${subject.code}) will be permanently removed, along with its attendance and exam records. This cannot be undone.`}
            />
          </Paper>
        </Box>
      </Box>

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
            Attendance summary
          </Typography>
          <AttendancePieChart present={presentTotal} absent={absentTotal} height={240} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Marks summary
          </Typography>
          <Typography variant="body1">
            {graded.length} of {students.length} student{students.length === 1 ? "" : "s"} graded
            {averageMarks === null ? "." : ` - average ${averageMarks}.`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sessions: {subject.sessions}. Marks are entered from a student&apos;s page.
          </Typography>
        </Paper>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Class roster
      </Typography>

      <TableShell
        headers={["Roll no.", "Student", "Marks", "Present", "Absent", "Attendance", "Actions"]}
        isEmpty={roster.length === 0}
        emptyMessage="This class has no students yet. Add a student, then their marks and attendance appear here."
      >
        {roster.map((row) => (
          <TableRow key={row.student.id}>
            <TableCell>{row.student.rollNumber}</TableCell>
            <TableCell>{row.student.fullName}</TableCell>
            <TableCell>{row.marksObtained ?? "-"}</TableCell>
            <TableCell>{row.present}</TableCell>
            <TableCell>{row.absent}</TableCell>
            <TableCell>{row.present + row.absent === 0 ? "-" : `${row.percentage}%`}</TableCell>
            <TableCell>
              <Button
                component={Link}
                href={`/admin/students/${row.student.id}`}
                size="small"
                variant="outlined"
              >
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
