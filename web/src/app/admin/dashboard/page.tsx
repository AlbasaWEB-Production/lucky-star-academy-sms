import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SchoolIcon from "@mui/icons-material/School";
import EventNoteIcon from "@mui/icons-material/EventNote";

import PeopleBreakdown from "@/components/charts/PeopleBreakdown";
import QuestionBarChart from "@/components/charts/QuestionBarChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import {
  getDashboardStats,
  listAttendanceCoverageForDate,
  listClasses,
  listNotices,
  listSubjects,
} from "@/lib/data/queries";

export const metadata = {
  title: "Admin dashboard",
};

/** Local calendar date as YYYY-MM-DD, matching the `date` column format. */
function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function AdminDashboardPage() {
  const today = localIsoDate(new Date());

  // Independent reads, so they run concurrently rather than in sequence.
  const [stats, classes, notices, coverage, subjects] = await Promise.all([
    getDashboardStats(),
    listClasses(),
    listNotices(),
    listAttendanceCoverageForDate(today),
    listSubjects(),
  ]);

  // Join the classes that have attendance rows against the full class list, so
  // a class with no attendance today surfaces as a 0 - the actionable gap.
  const recordedByClass = new Map(coverage.map((row) => [row.classId, row.recordedCount]));
  const attendanceToday = classes.map((row) => ({
    name: row.name,
    value: recordedByClass.get(row.id) ?? 0,
  }));

  const classesWithoutAttendance = attendanceToday.filter((row) => row.value === 0);
  const unassignedSubjects = subjects.filter((subject) => subject.teacherId === null);

  const studentsPerClass = classes.map((row) => ({ name: row.name, value: row.studentCount }));
  const recentNotices = notices.slice(0, 5);

  const attentionItems = [
    {
      key: "complaints",
      count: stats.complaints,
      label: "open complaint" + (stats.complaints === 1 ? "" : "s"),
      href: "/admin/complaints",
    },
    {
      key: "subjects",
      count: unassignedSubjects.length,
      label:
        unassignedSubjects.length === 1
          ? "subject without a teacher"
          : "subjects without a teacher",
      href: "/admin/subjects",
    },
    {
      key: "attendance",
      count: classesWithoutAttendance.length,
      label:
        classesWithoutAttendance.length === 1
          ? "class without attendance today"
          : "classes without attendance today",
      href: "/admin/attendance",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="What needs your attention today, and how your school is put together."
        action={
          <Button component={Link} href="/admin/students/add" variant="contained">
            Add student
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
            Attendance today
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Students marked by class
          </Typography>
          <QuestionBarChart
            data={attendanceToday}
            question="Students marked present or absent today, by class"
            unit="students"
            horizontal
            color="#147B45"
            height={Math.max(220, attendanceToday.length * 44)}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Needs attention
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Today&apos;s to-do list
          </Typography>

          {attentionItems.every((item) => item.count === 0) ? (
            <EmptyState
              title="Nothing needs attention"
              description="Every class has attendance recorded, every subject has a teacher, and there are no open complaints. The school is fully covered today."
            />
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {attentionItems.map((item) => (
                <Box
                  key={item.key}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: "12px",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                  component={Link}
                  href={item.href}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: "rgba(20, 123, 69, 0.12)",
                      color: "primary.main",
                      flexShrink: 0,
                    }}
                  >
                    {item.key === "complaints" ? (
                      <ReportProblemIcon fontSize="small" />
                    ) : item.key === "subjects" ? (
                      <SchoolIcon fontSize="small" />
                    ) : (
                      <EventNoteIcon fontSize="small" />
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                      {item.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    View
                  </Typography>
                </Box>
              ))}
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
            People
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Who is in your school
          </Typography>
          <PeopleBreakdown
            students={stats.students}
            teachers={stats.teachers}
            admins={stats.admins}
            height={220}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Class sizes
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Students per class
          </Typography>
          <QuestionBarChart
            data={studentsPerClass}
            question="Students per class"
            unit="students"
            color="#083E28"
            height={220}
          />
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Recent notices</Typography>
          <Button component={Link} href="/admin/notices" size="small">
            View all
          </Button>
        </Box>

        {recentNotices.length === 0 ? (
          <EmptyState
            title="No notices yet"
            description="Notices you publish appear here and on every portal."
            action={
              <Button component={Link} href="/admin/notices/add" variant="outlined">
                Publish a notice
              </Button>
            }
          />
        ) : (
          <Box sx={{ display: "grid", gap: 2 }}>
            {recentNotices.map((notice) => (
              <Box key={notice.id} sx={{ borderLeft: "3px solid", borderColor: "primary.main", pl: 2 }}>
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
