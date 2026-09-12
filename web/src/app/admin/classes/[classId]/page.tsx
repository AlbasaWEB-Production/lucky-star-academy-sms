import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import EditClassForm from "@/components/admin/EditClassForm";
import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { deleteClassAction } from "@/lib/actions/roster";
import { getClassById, listStudentsByClass, listSubjectsByClass } from "@/lib/data/queries";

export const metadata = {
  title: "Class details",
};

/**
 * Next.js 16 hands route params in as a Promise, so they must be awaited.
 */
export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const classroom = await getClassById(classId);

  if (!classroom) {
    notFound();
  }

  const [students, subjects] = await Promise.all([
    listStudentsByClass(classId),
    listSubjectsByClass(classId),
  ]);

  return (
    <>
      <PageHeader
        title={classroom.name}
        subtitle={`${students.length} student${students.length === 1 ? "" : "s"} - ${subjects.length} subject${subjects.length === 1 ? "" : "s"}`}
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button component={Link} href="/admin/students/add" variant="outlined">
              Add student
            </Button>
            <Button component={Link} href="/admin/subjects/add" variant="contained">
              Add subject
            </Button>
          </Box>
        }
      />

      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, alignItems: "start", mb: 4 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Details
          </Typography>
          <EditClassForm classRecord={classroom} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Danger zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Deleting a class also deletes its subjects. The database refuses the delete while any
            student still belongs to the class, so this is only available for an empty class.
          </Typography>
          <ConfirmActionButton
            action={deleteClassAction}
            fields={{ classId: classroom.id }}
            label="Delete class"
            confirmTitle="Delete this class?"
            confirmMessage={`${classroom.name} and its ${subjects.length} subject${subjects.length === 1 ? "" : "s"} will be permanently removed. This cannot be undone.`}
          />
        </Paper>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Students
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TableShell
          headers={["Roll no.", "Name", "Actions"]}
          isEmpty={students.length === 0}
          emptyMessage="No students in this class yet. Add a student and choose this class."
        >
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.rollNumber}</TableCell>
              <TableCell>{student.fullName}</TableCell>
              <TableCell>
                <Button
                  component={Link}
                  href={`/admin/students/${student.id}`}
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
        Subjects
      </Typography>

      <TableShell
        headers={["Subject name", "Code", "Teacher", "Actions"]}
        isEmpty={subjects.length === 0}
        emptyMessage="No subjects in this class yet. Add a subject and choose this class."
      >
        {subjects.map((subject) => (
          <TableRow key={subject.id}>
            <TableCell>{subject.name}</TableCell>
            <TableCell>{subject.code}</TableCell>
            <TableCell>{subject.teacherName ?? "Unassigned"}</TableCell>
            <TableCell>
              <Button
                component={Link}
                href={`/admin/subjects/${subject.id}`}
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
