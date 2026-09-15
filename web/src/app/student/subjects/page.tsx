import { Paper, TableCell, TableRow, Typography } from "@mui/material";

import MarksBarChart from "@/components/charts/MarksBarChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import {
  getOwnStudentRecord,
  listExamResultsForStudent,
  listSubjectsByClass,
} from "@/lib/data/queries";

export const metadata = {
  title: "My subjects",
};

/**
 * The subjects taught to the student's class, next to the student's own mark in
 * each one.
 *
 * The legacy page toggled between this table and a bar chart; both are shown
 * here, because a table of every subject is useful even when only a few carry
 * marks yet.
 */
export default async function StudentSubjectsPage() {
  const session = await requireRoleWithTenant("student");
  const student = await getOwnStudentRecord(session.id);

  if (!student) {
    return (
      <>
        <PageHeader title="My subjects" />
        <EmptyState
          title="Your student record is not ready yet"
          description="Your login works, but no student record is linked to it, so your class - and therefore your subjects - cannot be worked out. Ask your school office to complete your enrolment, then sign in again."
        />
      </>
    );
  }

  const [subjects, marks] = await Promise.all([
    listSubjectsByClass(student.classId),
    listExamResultsForStudent(session.id),
  ]);

  // `listExamResultsForStudent` returns one entry per marked subject, so this
  // joins the class subject list against the student's own marks in memory
  // rather than issuing a query per subject.
  const marksBySubject = new Map(marks.map((entry) => [entry.subjectId, entry.marksObtained]));

  return (
    <>
      <PageHeader
        title="My subjects"
        subtitle={`${subjects.length} subject${subjects.length === 1 ? "" : "s"} in ${student.className}.`}
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="overline" color="text.secondary">
          Performance
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Marks by subject
        </Typography>
        <MarksBarChart
          data={marks.map((entry) => ({ name: entry.subjectName, value: entry.marksObtained }))}
          height={300}
        />
      </Paper>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Subject details
      </Typography>

      <TableShell
        headers={["Subject", "Code", "Sessions", "Teacher", "Your mark"]}
        columnAlign={["left", "left", "right", "left", "right"]}
        isEmpty={subjects.length === 0}
        emptyMessage="No subjects have been created for your class yet. Your school office adds them."
      >
        {subjects.map((subject) => {
          const mark = marksBySubject.get(subject.id);

          return (
            <TableRow key={subject.id}>
              <TableCell>{subject.name}</TableCell>
              <TableCell>{subject.code}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {subject.sessions}
              </TableCell>
              <TableCell>{subject.teacherName ?? "Not assigned yet"}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {mark === undefined ? "Not recorded" : mark}
              </TableCell>
            </TableRow>
          );
        })}
      </TableShell>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        My marks
      </Typography>

      <TableShell
        headers={["Subject", "Code", "Marks obtained"]}
        columnAlign={["left", "left", "right"]}
        isEmpty={marks.length === 0}
        emptyMessage="No marks have been recorded for you yet."
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
