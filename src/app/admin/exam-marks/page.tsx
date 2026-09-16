import Link from "@/components/NextLink";
import { Button } from "@mui/material";

import MarksEntryForm from "@/components/records/MarksEntryForm";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { listStudents, listSubjects } from "@/lib/data/queries";

export const metadata = {
  title: "Exam marks",
};

/**
 * Exam mark entry for the whole school.
 *
 * The legacy `StudentExamMarks.js` posted one request per student. Marks now
 * live in `exam_results`, unique per (student, subject), so a subject is
 * chosen once and the class roster is saved together - `MarksEntryForm` owns
 * that interaction and upserts on re-entry.
 *
 * Both reads are RLS-scoped, so no school filter is added here.
 */
export default async function AdminExamMarksPage() {
  const [subjectList, students] = await Promise.all([listSubjects(), listStudents()]);

  const subjects = subjectList.map((subject) => ({
    id: subject.id,
    name: subject.name,
    code: subject.code,
    classId: subject.classId,
    className: subject.className,
  }));

  return (
    <>
      <PageHeader
        title="Exam marks"
        subtitle="Pick a subject, then enter each student's marks. Re-entering a subject updates the existing marks, and a blank field skips that student."
      />

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects to grade"
          description="Marks are recorded subject by subject, so a class needs at least one subject before results can be entered."
          action={
            <Button component={Link} href="/admin/subjects/add" variant="contained">
              Add a subject
            </Button>
          }
        />
      ) : (
        <MarksEntryForm subjects={subjects} students={students} />
      )}
    </>
  );
}
