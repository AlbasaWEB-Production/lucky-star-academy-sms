import Link from "@/components/NextLink";
import { Button, TableCell, TableRow } from "@mui/material";

import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { getOwnTeacherAssignments, listStudents } from "@/lib/data/queries";

export const metadata = {
  title: "Students",
};

/**
 * Every student this teacher can see.
 *
 * The scoping is done by Row Level Security (`students_select_by_teacher`
 * allows only rows in a class the teacher teaches), so this page adds no class
 * filter of its own. The session is loaded only to count the teacher's classes
 * for the subtitle.
 */
export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const session = await requireRoleWithTenant("teacher");

  const [students, assignments] = await Promise.all([
    listStudents(),
    getOwnTeacherAssignments(session.id),
  ]);

  const filtered = query
    ? students.filter((student) =>
        [String(student.rollNumber), student.fullName, student.className].some((field) =>
          (field ?? "").toLowerCase().includes(query),
        ),
      )
    : students;

  const classCount = new Set(assignments.map((assignment) => assignment.classId)).size;

  const originalSubtitle =
    students.length > 0
      ? `${students.length} student${students.length === 1 ? "" : "s"} in ${classCount} class${classCount === 1 ? "" : "es"} you teach.`
      : "No students are enrolled in the classes you teach yet.";

  const subtitle = query
    ? `Showing ${filtered.length} of ${students.length} student${students.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  const emptyMessage =
    query && students.length > 0
      ? `Nothing matches “${q}”.`
      : "No students to show. You only see students in the classes you teach - ask an administrator if a class is missing.";

  return (
    <>
      <PageHeader title="Students" subtitle={subtitle} />

      <SearchBar placeholder="Search by roll number, name or class" initialQuery={q} />

      <TableShell
        headers={["Roll no.", "Name", "Class", ""]}
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
    </>
  );
}
