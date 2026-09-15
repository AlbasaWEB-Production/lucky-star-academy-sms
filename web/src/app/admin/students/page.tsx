import Link from "@/components/NextLink";
import { Box, Button, TableCell, TableRow, Typography } from "@mui/material";

import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { deleteStudentAction } from "@/lib/actions/roster";
import { listClasses, listStudents } from "@/lib/data/queries";

export const metadata = {
  title: "Students",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const [students, classes] = await Promise.all([listStudents(), listClasses()]);

  const filtered = query
    ? students.filter((student) =>
        [String(student.rollNumber), student.fullName, student.className].some((field) =>
          (field ?? "").toLowerCase().includes(query),
        ),
      )
    : students;

  const originalSubtitle =
    classes.length > 0
      ? `${students.length} student${students.length === 1 ? "" : "s"} across ${classes.length} class${classes.length === 1 ? "" : "es"}.`
      : `${students.length} student${students.length === 1 ? "" : "s"}.`;

  const subtitle = query
    ? `Showing ${filtered.length} of ${students.length} student${students.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  const emptyMessage =
    query && students.length > 0
      ? `Nothing matches “${q}”.`
      : "No students yet. Add your first student to get started.";

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={subtitle}
        action={
          <Button
            component={Link}
            href="/admin/students/add"
            variant="contained"
            disabled={classes.length === 0}
          >
            Add student
          </Button>
        }
      />

      {classes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create a class first - every student must belong to one.
        </Typography>
      ) : null}

      <SearchBar placeholder="Search by roll number, name or class" initialQuery={q} />

      <TableShell
        headers={["Roll no.", "Name", "Class", "Actions"]}
        density="compact"
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((student) => (
          <TableRow key={student.id}>
            <TableCell>{student.rollNumber}</TableCell>
            <TableCell>{student.fullName}</TableCell>
            <TableCell>{student.className}</TableCell>
            <TableCell>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  component={Link}
                  href={`/admin/students/${student.id}`}
                  size="small"
                  variant="outlined"
                >
                  View
                </Button>

                <ConfirmActionButton
                  action={deleteStudentAction}
                  fields={{ studentId: student.id }}
                  label="Delete"
                  confirmTitle="Delete this student?"
                  confirmMessage={`${student.fullName} and all of their attendance and exam records will be permanently removed, along with their login. This cannot be undone.`}
                />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
