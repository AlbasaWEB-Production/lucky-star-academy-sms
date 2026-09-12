import Link from "@/components/NextLink";
import { Button } from "@mui/material";

import AttendanceMarker from "@/components/records/AttendanceMarker";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { listStudents, listSubjects } from "@/lib/data/queries";

export const metadata = {
  title: "Attendance",
};

/**
 * Attendance marking for the whole school.
 *
 * The legacy `StudentAttendance.js` posted one request per student. Attendance
 * now lives in its own table keyed by (student, subject, date), so a subject
 * and a date are chosen once and the entire class roster is saved in a single
 * submit - `AttendanceMarker` owns that interaction.
 *
 * Both reads are RLS-scoped: an admin sees every subject and every student, so
 * neither query needs a school filter.
 */
export default async function AdminAttendancePage() {
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
        title="Attendance"
        subtitle="Pick a subject and a date, then mark the whole class at once. Saving the same day again corrects those records instead of duplicating them."
      />

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects to mark"
          description="Attendance is recorded subject by subject, so a class needs at least one subject before a roster can be marked."
          action={
            <Button component={Link} href="/admin/subjects/add" variant="contained">
              Add a subject
            </Button>
          }
        />
      ) : (
        <AttendanceMarker subjects={subjects} students={students} />
      )}
    </>
  );
}
