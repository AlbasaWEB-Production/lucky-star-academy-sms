import PageHeader from "@/components/ui/PageHeader";
import MarksEntryForm from "@/components/records/MarksEntryForm";
import { type MarkableSubject } from "@/components/records/AttendanceMarker";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { getOwnTeacherAssignments, listStudents } from "@/lib/data/queries";

export const metadata = {
  title: "Exam marks",
};

/**
 * Exam mark entry for a teacher.
 *
 * Same shape as the attendance screen: the picker holds only the teacher's own
 * subjects, and their classes' students are passed in once and filtered by
 * class in the browser. Marks are upserted per (student, subject), so
 * re-entering a subject corrects it rather than duplicating it.
 */
export default async function TeacherExamMarksPage() {
  const session = await requireRoleWithTenant("teacher");

  const [assignments, students] = await Promise.all([
    getOwnTeacherAssignments(session.id),
    listStudents(),
  ]);

  const subjects: MarkableSubject[] = assignments.map((assignment) => ({
    id: assignment.subjectId,
    name: assignment.subjectName,
    code: assignment.subjectCode,
    classId: assignment.classId,
    className: assignment.className,
  }));

  return (
    <>
      <PageHeader
        title="Exam marks"
        subtitle="Choose one of your subjects and enter the marks for its class."
      />
      <MarksEntryForm subjects={subjects} students={students} />
    </>
  );
}
