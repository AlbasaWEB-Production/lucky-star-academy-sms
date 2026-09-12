import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import ClassIcon from "@mui/icons-material/Class";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import MarksBarChart from "@/components/charts/MarksBarChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { getOwnTeacherAssignments, listNotices, listStudents } from "@/lib/data/queries";

export const metadata = {
  title: "Teacher dashboard",
};

/**
 * The teacher's home screen.
 *
 * The legacy TeacherHomePage read a single `teachSclass` / `teachSubject` off
 * the user document. Here the relationship lives on `public.subjects.teacher_id`
 * and a teacher can hold several, so every read helper is asked for the whole
 * set and nothing assumes exactly one class.
 *
 * No role check is needed for the data itself - Row Level Security already
 * limits `listStudents()` to the classes this teacher teaches. The session is
 * loaded only to key `getOwnTeacherAssignments()`.
 */
export default async function TeacherDashboardPage() {
  const session = await requireRoleWithTenant("teacher");

  // Independent reads, so they run concurrently rather than in sequence.
  const [assignments, students, notices] = await Promise.all([
    getOwnTeacherAssignments(session.id),
    listStudents(),
    listNotices(),
  ]);

  // Distinct classes, derived from the assignments rather than stored on the
  // teacher. A class keeps its bar even when it currently has no students.
  const classNamesById = new Map<string, string>();
  for (const assignment of assignments) {
    classNamesById.set(assignment.classId, assignment.className);
  }

  const studentsPerClass = Array.from(classNamesById, ([classId, className]) => ({
    name: className,
    value: students.filter((student) => student.classId === classId).length,
  }));

  const sortedAssignments = [...assignments].sort(
    (a, b) => a.className.localeCompare(b.className) || a.subjectName.localeCompare(b.subjectName),
  );

  const recentNotices = notices.slice(0, 5);
  const classCount = classNamesById.size;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your classes, students and the latest notices."
        action={
          <Button component={Link} href="/teacher/attendance" variant="contained">
            Take attendance
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
          label="My subjects"
          value={assignments.length}
          icon={<MenuBookIcon />}
          hint="Subjects assigned to you"
        />
        <StatCard
          label="My classes"
          value={classCount}
          icon={<ClassIcon />}
          accent="#270843"
          hint="Classes you teach in"
        />
        <StatCard
          label="Students"
          value={students.length}
          icon={<GroupsIcon />}
          accent="#080a43"
          hint="Across your classes"
        />
        <StatCard
          label="Notices"
          value={notices.length}
          icon={<AnnouncementIcon />}
          accent="#b26a00"
          hint="Published by your school"
        />
      </Box>

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
          <Typography variant="h6" sx={{ mb: 2 }}>
            Students per class
          </Typography>
          <MarksBarChart data={studentsPerClass} height={300} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
          >
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

      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
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
    </>
  );
}
