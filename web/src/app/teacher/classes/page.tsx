import Link from "@/components/NextLink";
import { Button, TableCell, TableRow, Typography } from "@mui/material";

import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { getOwnTeacherAssignments, listStudents } from "@/lib/data/queries";

export const metadata = {
  title: "My classes",
};

type TaughtClass = {
  classId: string;
  className: string;
  subjects: { id: string; name: string; code: string }[];
  studentCount: number;
};

/**
 * The classes this teacher teaches in.
 *
 * There is no class list on the teacher row in this schema, so the classes are
 * grouped out of the subject assignments: a teacher who holds three subjects
 * in two classes gets two rows, each listing all of their subjects there.
 *
 * `listStudents()` is RLS-scoped to those same classes, so the counts never
 * include a class the teacher does not teach.
 */
export default async function TeacherClassesPage() {
  const session = await requireRoleWithTenant("teacher");

  const [assignments, students] = await Promise.all([
    getOwnTeacherAssignments(session.id),
    listStudents(),
  ]);

  const byClass = new Map<string, TaughtClass>();

  for (const assignment of assignments) {
    const entry = byClass.get(assignment.classId) ?? {
      classId: assignment.classId,
      className: assignment.className,
      subjects: [],
      studentCount: 0,
    };

    entry.subjects.push({
      id: assignment.subjectId,
      name: assignment.subjectName,
      code: assignment.subjectCode,
    });

    byClass.set(assignment.classId, entry);
  }

  const studentCounts = new Map<string, number>();
  for (const student of students) {
    studentCounts.set(student.classId, (studentCounts.get(student.classId) ?? 0) + 1);
  }

  const taughtClasses = Array.from(byClass.values())
    .map((entry) => ({ ...entry, studentCount: studentCounts.get(entry.classId) ?? 0 }))
    .sort((a, b) => a.className.localeCompare(b.className));

  const subtitle =
    taughtClasses.length > 0
      ? `${assignments.length} subject${assignments.length === 1 ? "" : "s"} across ${taughtClasses.length} class${taughtClasses.length === 1 ? "" : "es"}.`
      : "No classes are assigned to you yet.";

  return (
    <>
      <PageHeader title="My classes" subtitle={subtitle} />

      {taughtClasses.length === 0 ? (
        <EmptyState
          title="You do not teach any classes yet"
          description="An administrator assigns subjects to teachers. Once a subject of yours belongs to a class, that class appears here with its roster."
        />
      ) : (
        <TableShell
          headers={["Class", "Subjects you teach", "Students", ""]}
          isEmpty={false}
          emptyMessage="You do not teach any classes yet."
        >
          {taughtClasses.map((entry) => (
            <TableRow key={entry.classId}>
              <TableCell>{entry.className}</TableCell>
              <TableCell>
                {entry.subjects.map((subject) => (
                  <Typography key={subject.id} variant="body2">
                    {subject.name} ({subject.code})
                  </Typography>
                ))}
              </TableCell>
              <TableCell>{entry.studentCount}</TableCell>
              <TableCell>
                <Button
                  component={Link}
                  href={`/teacher/classes/${entry.classId}`}
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
