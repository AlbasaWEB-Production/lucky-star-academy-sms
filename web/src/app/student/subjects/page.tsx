import { Paper, TableCell, TableRow, Typography } from "@mui/material";

import MarksBarChart from "@/components/charts/MarksBarChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
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
export default async function StudentSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

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

  const filteredSubjects = query
    ? subjects.filter((subject) =>
        [subject.name, subject.code, subject.teacherName].some((field) =>
          (field ?? "").toLowerCase().includes(query),
        ),
      )
    : subjects;

  const filteredMarks = query
    ? marks.filter((entry) =>
        [entry.subjectName, entry.subjectCode].some((field) =>
          (field ?? "").toLowerCase().includes(query),
        ),
      )
    : marks;

  const originalSubtitle = `${subjects.length} subject${subjects.length === 1 ? "" : "s"} in ${student.className}.`;

  const subtitle = query
    ? `Showing ${filteredSubjects.length} of ${subjects.length} subject${subjects.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  const subjectsEmptyMessage =
    query && subjects.length > 0
      ? `Nothing matches “${q}”.`
      : "No subjects have been created for your class yet. Your school office adds them.";

  const marksEmptyMessage =
    query && marks.length > 0
      ? `Nothing matches “${q}”.`
      : "No marks have been recorded for you yet.";

  // `listExamResultsForStudent` returns one entry per marked subject, so this
  // joins the class subject list against the student's own marks in memory
  // rather than issuing a query per subject.
  const marksBySubject = new Map(marks.map((entry) => [entry.subjectId, entry.marksObtained]));

  return (
    <>
      <PageHeader title="My subjects" subtitle={subtitle} />

      <SearchBar placeholder="Search by subject, code or teacher" initialQuery={q} />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="overline" color="text.secondary">
          Performance
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Marks by subject
        </Typography>
        <MarksBarChart
          data={filteredMarks.map((entry) => ({ name: entry.subjectName, value: entry.marksObtained }))}
          height={300}
        />
      </Paper>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Subject details
      </Typography>

      <TableShell
        headers={["Subject", "Code", "Sessions", "Teacher", "Your mark"]}
        columnAlign={["left", "left", "right", "left", "right"]}
        isEmpty={filteredSubjects.length === 0}
        emptyMessage={subjectsEmptyMessage}
      >
        {filteredSubjects.map((subject) => {
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
        isEmpty={filteredMarks.length === 0}
        emptyMessage={marksEmptyMessage}
      >
        {filteredMarks.map((entry) => (
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
