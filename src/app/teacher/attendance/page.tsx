import PageHeader from "@/components/ui/PageHeader";
import AttendanceMarker, {
  type MarkableSubject,
} from "@/components/records/AttendanceMarker";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { getOwnTeacherAssignments, listStudents } from "@/lib/data/queries";

export const metadata = {
  title: "Attendance",
};

/**
 * Attendance marking for a teacher.
 *
 * The subject picker is built from `getOwnTeacherAssignments()` rather than
 * every subject in the school, so a teacher is offered only their own classes.
 * `listStudents()` is RLS-scoped to those same classes and is passed in whole;
 * the component filters it by the selected subject's class in the browser.
 *
 * The legacy app recorded one student at a time through a Redux action per
 * click. The marker submits the whole roster in a single request, and RLS
 * (`attendance_insert_by_admin_or_teacher`) still refuses a subject that is not
 * this teacher's.
 */
export default async function TeacherAttendancePage() {
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
        title="Attendance"
        subtitle="Pick one of your subjects and a date, then mark the class."
      />
      <AttendanceMarker subjects={subjects} students={students} />
    </>
  );
}
