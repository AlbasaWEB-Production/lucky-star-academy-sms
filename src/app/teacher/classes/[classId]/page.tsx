import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { getOwnTeacherAssignments, listStudentsByClass } from "@/lib/data/queries";

export const metadata = {
  title: "Class details",
};

/**
 * One class this teacher teaches.
 *
 * `getOwnTeacherAssignments` is the gate: a class only exists for this teacher
 * if one of their subjects belongs to it. Row Level Security would return no
 * rows for a class they do not teach anyway, so `notFound()` is both the
 * correct permission answer and the honest one - the class is not part of this
 * teacher's world.
 */
export default async function TeacherClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const session = await requireRoleWithTenant("teacher");

  const assignments = await getOwnTeacherAssignments(session.id);
  const taughtHere = assignments.filter((assignment) => assignment.classId === classId);
  const first = taughtHere[0];

  if (!first) {
    notFound();
  }

  const students = await listStudentsByClass(classId);

  return (
    <>
      <PageHeader
        title={first.className}
        subtitle={`You teach ${taughtHere.length} subject${taughtHere.length === 1 ? "" : "s"} in this class.`}
        action={
          <Button component={Link} href="/teacher/classes" variant="outlined">
            Back to my classes
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Subjects you teach here
        </Typography>

        {taughtHere.map((assignment) => (
          <Box
            key={assignment.subjectId}
            sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.5 }}
          >
            <Typography variant="body1">{assignment.subjectName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {assignment.subjectCode}
            </Typography>
          </Box>
        ))}
      </Paper>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Class list
      </Typography>

      {students.length === 0 ? (
        <EmptyState
          title="No students in this class yet"
          description="Students are added by your school administrator. Once they are enrolled, their names appear here."
        />
      ) : (
        <TableShell
          headers={["Roll no.", "Name", ""]}
          density="compact"
          isEmpty={false}
          emptyMessage="No students in this class yet."
        >
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.rollNumber}</TableCell>
              <TableCell>{student.fullName}</TableCell>
              <TableCell>
                <Button
                  component={Link}
                  href={`/teacher/students/${student.id}`}
                  size="small"
                  variant="outlined"
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>
      )}
    </>
  );
}
