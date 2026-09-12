import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import ClassIcon from "@mui/icons-material/Class";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

import MarksBarChart from "@/components/charts/MarksBarChart";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { getDashboardStats, listClasses, listNotices } from "@/lib/data/queries";

export const metadata = {
  title: "Admin dashboard",
};

export default async function AdminDashboardPage() {
  // Independent reads, so they run concurrently rather than in sequence.
  const [stats, classes, notices] = await Promise.all([
    getDashboardStats(),
    listClasses(),
    listNotices(),
  ]);

  const studentsPerClass = classes.map((row) => ({ name: row.name, value: row.studentCount }));
  const recentNotices = notices.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of your school."
        action={
          <Button component={Link} href="/admin/students/add" variant="contained">
            Add student
          </Button>
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          mb: 4,
        }}
      >
        <StatCard label="Students" value={stats.students} icon={<GroupsIcon />} />
        <StatCard label="Teachers" value={stats.teachers} icon={<SchoolIcon />} accent="#080a43" />
        <StatCard label="Classes" value={stats.classes} icon={<ClassIcon />} accent="#270843" />
        <StatCard label="Subjects" value={stats.subjects} icon={<MenuBookIcon />} accent="#266810" />
        <StatCard
          label="Notices"
          value={stats.notices}
          icon={<AnnouncementIcon />}
          accent="#b26a00"
        />
        <StatCard
          label="Complaints"
          value={stats.complaints}
          icon={<ReportProblemIcon />}
          accent="#c62828"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
          alignItems: "start",
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
      </Box>
    </>
  );
}
