import Link from "@/components/NextLink";
import { Box, Button, TableCell, TableRow, Typography } from "@mui/material";

import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { deleteTeacherAction } from "@/lib/actions/roster";
import { listTeachers } from "@/lib/data/queries";

export const metadata = {
  title: "Teachers",
};

export default async function TeachersPage() {
  const teachers = await listTeachers();

  const unassignedCount = teachers.filter((teacher) => teacher.assignments.length === 0).length;

  const subtitle =
    teachers.length === 0
      ? "No teachers yet."
      : `${teachers.length} teacher${teachers.length === 1 ? "" : "s"}, ${unassignedCount} without a subject.`;

  return (
    <>
      <PageHeader
        title="Teachers"
        subtitle={subtitle}
        action={
          <Button component={Link} href="/admin/teachers/add" variant="contained">
            Add teacher
          </Button>
        }
      />

      <TableShell
        headers={["Name", "Email", "Assignments", "Subjects", "Actions"]}
        isEmpty={teachers.length === 0}
        emptyMessage="No teachers yet. Add a teacher, then assign them to subjects from the Subjects page."
      >
        {teachers.map((teacher) => (
          <TableRow key={teacher.id}>
            <TableCell>{teacher.fullName}</TableCell>
            <TableCell>{teacher.email ?? "-"}</TableCell>
            <TableCell>
              {teacher.assignments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No subjects assigned
                </Typography>
              ) : (
                teacher.assignments
                  .map((assignment) => `${assignment.subjectName} (${assignment.className})`)
                  .join(", ")
              )}
            </TableCell>
            <TableCell>{teacher.assignments.length}</TableCell>
            <TableCell>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  component={Link}
                  href={`/admin/teachers/${teacher.id}`}
                  size="small"
                  variant="outlined"
                >
                  View
                </Button>

                <ConfirmActionButton
                  action={deleteTeacherAction}
                  fields={{ teacherId: teacher.id }}
                  label="Delete"
                  confirmTitle="Delete this teacher?"
                  confirmMessage={`${teacher.fullName}'s login will be removed. Their ${teacher.assignments.length} subject${teacher.assignments.length === 1 ? "" : "s"} stay in place, but become unassigned. This cannot be undone.`}
                />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
