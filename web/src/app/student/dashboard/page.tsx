import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import GradeIcon from "@mui/icons-material/Grade";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PercentIcon from "@mui/icons-material/Percent";

import AttendancePieChart from "@/components/charts/AttendancePieChart";
import MarksBarChart from "@/components/charts/MarksBarChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
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

/**
 * The student's home page.
 *
 * A student's identity *is* their user id: `public.students.id` equals the
 * `profiles.id` of the account, so `session.id` is handed straight to the read
 * helpers. Row Level Security then limits each of those reads to this student's
 * own rows, which is why none of them carries a school filter.
 *
 * The legacy portal computed every figure here in the browser from an embedded
 * attendance array (`attendanceCalculator.js`). That arithmetic now lives in
 * `summariseAttendanceForStudent()`, so this page only aggregates its result.
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

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          mb: 4,
        }}
      >
        <StatCard
          label="Overall attendance"
          value={recorded > 0 ? `${attendancePercentage}%` : "-"}
          hint={recorded > 0 ? `${present} present of ${recorded} recorded` : "No attendance recorded yet"}
          icon={<PercentIcon />}
        />
        <StatCard
          label="Subjects"
          value={subjects.length}
          hint={`In ${student.className}`}
          icon={<MenuBookIcon />}
          accent="#080a43"
        />
        <StatCard
          label="Average marks"
          value={averageMarks ?? "-"}
          hint={
            marks.length > 0
              ? `Across ${marks.length} subject${marks.length === 1 ? "" : "s"}`
              : "No marks recorded yet"
          }
          icon={<GradeIcon />}
          accent="#266810"
        />
        <StatCard
          label="Notices"
          value={notices.length}
          hint="Published by your school"
          icon={<AnnouncementIcon />}
          accent="#b26a00"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
          alignItems: "start",
          mb: 3,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Marks by subject
          </Typography>
          <MarksBarChart
            data={marks.map((entry) => ({ name: entry.subjectName, value: entry.marksObtained }))}
            height={300}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Attendance overall
          </Typography>
          <AttendancePieChart present={present} absent={absent} height={300} />
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
