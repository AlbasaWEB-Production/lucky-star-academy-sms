import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import QuestionBarChart from "@/components/charts/QuestionBarChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import {
  countMarksBySubjectForTeacher,
  getOwnTeacherAssignments,
  listAttendanceCoverageForTeacher,
  listNotices,
  summariseClassAttendanceForTeacher,
} from "@/lib/data/queries";

export const metadata = {
  title: "Teacher dashboard",
};

/** Local calendar date as YYYY-MM-DD, matching the `date` column format. */
function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * The teacher's home screen.
 *
 * The question it answers is "Which of my classes still need me today, and is
 * anything drifting?" The hero is the attendance-to-do list: every class the
 * teacher is assigned to, with how many students have been marked today, so
 * the classes at zero are the ones still to do. Row Level Security limits every
 * read to the teacher's own subjects, so no role check is needed beyond
 * loading the session to key the helpers.
 */
export default async function TeacherDashboardPage() {
  const session = await requireRoleWithTenant("teacher");
  const today = localIsoDate(new Date());

  // Independent reads, so they run concurrently rather than in sequence.
  const [assignments, coverage, rate, marksBySubject, notices] = await Promise.all([
    getOwnTeacherAssignments(session.id),
    listAttendanceCoverageForTeacher(session.id, today),
    summariseClassAttendanceForTeacher(session.id),
    countMarksBySubjectForTeacher(session.id),
    listNotices(),
  ]);

  const attendanceToday = coverage.map((row) => ({
    name: row.className,
    value: row.recordedCount,
  }));

  const classesStillToDo = coverage.filter((row) => row.recordedCount === 0);

  const attendanceRate = rate.map((row) => ({
    name: row.className,
    value: row.percentage,
  }));

  const marksData = marksBySubject.map((row) => ({
    name: row.subjectName,
    value: row.count,
  }));

  const sortedAssignments = [...assignments].sort(
    (a, b) => a.className.localeCompare(b.className) || a.subjectName.localeCompare(b.subjectName),
  );

  const recentNotices = notices.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your classes, what still needs marking today, and the latest notices."
        action={
          <Button component={Link} href="/teacher/attendance" variant="contained">
            Take attendance
          </Button>
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
          alignItems: "start",
          mb: 4,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Today
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Attendance marked by class
          </Typography>
          {attendanceToday.length === 0 ? (
            <EmptyState
              title="No classes assigned yet"
              description="Once an administrator assigns you a subject, its class appears here so you can take attendance."
            />
          ) : (
            <QuestionBarChart
              data={attendanceToday}
              question="Students marked present or absent today, by class"
              unit="students"
              horizontal
              color="#147B45"
              height={Math.max(220, attendanceToday.length * 44)}
            />
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Today&apos;s to-do
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {classesStillToDo.length === 0
              ? "All marked"
              : classesStillToDo.length === 1
                ? "1 class still to mark"
                : `${classesStillToDo.length} classes still to mark`}
          </Typography>

          {classesStillToDo.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                color: "primary.main",
                p: 1.5,
              }}
            >
              <CheckCircleIcon fontSize="small" />
              <Typography variant="body2">
                Every class has attendance recorded today. You&apos;re done.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 1 }}>
              {classesStillToDo.map((row) => (
                <Box key={row.classId} sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "action.hover" }}>
                  <Typography variant="subtitle2">{row.className}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    No students marked yet
                  </Typography>
                </Box>
              ))}
              <Button
                component={Link}
                href="/teacher/attendance"
                variant="outlined"
                size="small"
                sx={{ mt: 1, alignSelf: "flex-start" }}
              >
                Mark attendance
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

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
            Attendance rate by class
          </Typography>
          <QuestionBarChart
            data={attendanceRate}
            question="Attendance rate by class"
            unit="%"
            horizontal
            color="#083E28"
            height={Math.max(220, attendanceRate.length * 44)}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Marks
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Marks entered per subject
          </Typography>
          <QuestionBarChart
            data={marksData}
            question="Marks entered per subject"
            unit="marks"
            color="#F2B705"
            height={220}
          />
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
          alignItems: "start",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Your teaching assignments</Typography>
            <Button component={Link} href="/teacher/classes" size="small">
              My classes
            </Button>
          </Box>

          {sortedAssignments.length === 0 ? (
            <Paper variant="outlined">
              <EmptyState
                title="No subjects assigned yet"
                description="An administrator assigns subjects to teachers. Once a subject is yours, its class, roster and marking screens appear here."
              />
            </Paper>
          ) : (
            <TableShell
              headers={["Subject", "Code", "Class", ""]}
              isEmpty={false}
              emptyMessage="No subjects have been assigned to you yet."
            >
              {sortedAssignments.map((assignment) => (
                <TableRow key={assignment.subjectId}>
                  <TableCell>{assignment.subjectName}</TableCell>
                  <TableCell>{assignment.subjectCode}</TableCell>
                  <TableCell>{assignment.className}</TableCell>
                  <TableCell>
                    <Button
                      component={Link}
                      href={`/teacher/classes/${assignment.classId}`}
                      size="small"
                      variant="outlined"
                    >
                      Open class
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableShell>
          )}
        </Box>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Recent notices</Typography>
            <Button component={Link} href="/teacher/notices" size="small">
              View all
            </Button>
          </Box>

          {recentNotices.length === 0 ? (
            <EmptyState
              title="No notices yet"
              description="Notices published by your school appear here."
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
      </Box>
    </>
  );
}
