import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";

import AttendancePieChart from "@/components/charts/AttendancePieChart";
import QuestionBarChart from "@/components/charts/QuestionBarChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { requireRoleWithTenant } from "@/lib/auth/session";
import {
  getOwnStudentRecord,
  listExamResultsForStudent,
  listNotices,
  listSubjectsByClass,
  summariseAttendanceForStudent,
} from "@/lib/data/queries";

export const metadata = {
  title: "Student dashboard",
};

/** A supporting figure block: label, big number, and a quiet hint. */
function Figure({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Box sx={{ p: 2, borderRadius: "14px", border: "1px solid", borderColor: "divider" }}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h3" sx={{ lineHeight: 1.1, color: "secondary.main" }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

/**
 * The student's home page.
 *
 * The question it answers is "How am I doing - attendance and marks - and
 * what's new?" The hero is the attendance donut with the overall percentage
 * beside it, plus two supporting figures (average marks, subjects). Then the
 * per-subject attendance and marks, then the recent notices.
 *
 * A student's identity *is* their user id: `public.students.id` equals the
 * `profiles.id` of the account, so `session.id` is handed straight to the read
 * helpers. Row Level Security then limits each of those reads to this student's
 * own rows, which is why none of them carries a school filter.
 */
export default async function StudentDashboardPage() {
  const session = await requireRoleWithTenant("student");
  const student = await getOwnStudentRecord(session.id);

  // Reachable when the profile exists but its matching `students` row does not,
  // for example a half-finished enrolment. Every other read would come back
  // empty, so say so plainly instead of charting nothing.
  if (!student) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState
          title="Your student record is not ready yet"
          description="Your login works, but no student record is linked to it, so there are no subjects, marks or attendance to show. Ask your school office to complete your enrolment, then sign in again."
        />
      </>
    );
  }

  // Independent reads, so they run concurrently rather than in sequence.
  const [attendance, marks, notices, subjects] = await Promise.all([
    summariseAttendanceForStudent(session.id),
    listExamResultsForStudent(session.id),
    listNotices(),
    listSubjectsByClass(student.classId),
  ]);

  const present = attendance.reduce((total, entry) => total + entry.present, 0);
  const absent = attendance.reduce((total, entry) => total + entry.absent, 0);
  const recorded = present + absent;
  const attendancePercentage = recorded > 0 ? Math.round((present / recorded) * 1000) / 10 : 0;

  const marksTotal = marks.reduce((total, entry) => total + entry.marksObtained, 0);
  const averageMarks = marks.length > 0 ? Math.round((marksTotal / marks.length) * 10) / 10 : null;

  const attendanceBySubject = attendance.map((entry) => ({
    name: entry.subjectName,
    value: entry.percentage,
  }));

  const marksBySubject = marks.map((entry) => ({
    name: entry.subjectName,
    value: entry.marksObtained,
  }));

  const recentNotices = notices.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Roll number ${student.rollNumber} - ${student.className}`}
        action={
          <Button component={Link} href="/student/attendance" variant="contained">
            My attendance
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="overline" color="text.secondary">
          Attendance
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Attendance overall
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            alignItems: "center",
          }}
        >
          <AttendancePieChart present={present} absent={absent} height={260} />

          <Box sx={{ display: "grid", gap: 2 }}>
            <Figure
              label="Overall attendance"
              value={recorded > 0 ? `${attendancePercentage}%` : "-"}
              hint={
                recorded > 0
                  ? `${present} present of ${recorded} recorded`
                  : "No attendance recorded yet"
              }
            />
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <Figure
                label="Average marks"
                value={averageMarks ?? "-"}
                hint={
                  marks.length > 0
                    ? `Across ${marks.length} subject${marks.length === 1 ? "" : "s"}`
                    : "No marks recorded yet"
                }
              />
              <Figure
                label="Subjects"
                value={subjects.length}
                hint={`In ${student.className}`}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          alignItems: "start",
          mb: 4,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Attendance
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Attendance by subject
          </Typography>
          <QuestionBarChart
            data={attendanceBySubject}
            question="Attendance by subject"
            unit="%"
            horizontal
            color="#147B45"
            height={Math.max(220, attendanceBySubject.length * 44)}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Results
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Marks by subject
          </Typography>
          <QuestionBarChart
            data={marksBySubject}
            question="Marks by subject"
            unit="marks"
            color="#083E28"
            height={Math.max(220, marksBySubject.length * 44)}
          />
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Recent notices</Typography>
          <Button component={Link} href="/student/notices" size="small">
            View all
          </Button>
        </Box>

        {recentNotices.length === 0 ? (
          <EmptyState
            title="No notices yet"
            description="Notices your school publishes appear here."
          />
        ) : (
          <Box sx={{ display: "grid", gap: 2 }}>
            {recentNotices.map((notice) => (
              <Box
                key={notice.id}
                sx={{ borderLeft: "3px solid", borderColor: "primary.main", pl: 2 }}
              >
                <Typography variant="subtitle2">{notice.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(notice.date).toLocaleDateString()}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {notice.details}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </>
  );
}
