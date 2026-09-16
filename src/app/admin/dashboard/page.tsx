import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SchoolIcon from "@mui/icons-material/School";
import EventNoteIcon from "@mui/icons-material/EventNote";

import PeopleBreakdown from "@/components/charts/PeopleBreakdown";
import QuestionBarChart from "@/components/charts/QuestionBarChart";
import ChartCard from "@/components/dashboard/ChartCard";
import DataTable from "@/components/dashboard/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import {
  getCurrentTerm,
  listAtRiskPupils,
  listAttendanceRateByClass,
  listEnrolmentByCampus,
  listMarksByClassSubject,
  listNewEnrolmentsByTerm,
  listTeacherSubjectLoad,
  overallAttendanceRate,
  overallAverageMark,
} from "@/lib/data/dashboard";
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
  const [
    stats,
    classes,
    notices,
    coverage,
    subjects,
    rate,
    marks,
    atRisk,
    byCampus,
    enrolments,
    teacherLoad,
    currentTerm,
  ] = await Promise.all([
    getDashboardStats(),
    listClasses(),
    listNotices(),
    listAttendanceCoverageForDate(today),
    listSubjects(),
    listAttendanceRateByClass(),
    listMarksByClassSubject(),
    listAtRiskPupils(),
    listEnrolmentByCampus(),
    listNewEnrolmentsByTerm(),
    listTeacherSubjectLoad(),
    getCurrentTerm(),
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

  // Already worst-first from the data layer, so this reads as a to-do list.
  const rateByClass = rate.map((row) => ({ name: row.className, value: row.ratePercent }));

  const campusData = byCampus.map((row) => ({
    name: row.campus ?? "No campus set",
    value: row.studentCount,
  }));

  const enrolmentData = enrolments.map((row) => ({
    name: row.isCurrent ? `${row.termName} (now)` : row.termName,
    value: row.count,
  }));

  const termRate = overallAttendanceRate(rate);
  const avgMark = overallAverageMark(marks);

  const atRiskRows = atRisk.map((pupil) => ({
    pupil: pupil.studentName,
    class: pupil.className,
    campus: pupil.campus ?? "—",
    roll: pupil.rollNumber,
    reason: pupil.reason,
  }));

  const teacherRows = teacherLoad.map((row) => ({
    teacher: row.teacherName,
    subjects: row.subjectCount,
  }));

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
    {
      key: "atrisk",
      count: atRisk.length,
      label: atRisk.length === 1 ? "pupil at risk" : "pupils at risk",
      href: "#pupils-at-risk",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={
          currentTerm
            ? `What needs your attention today, and how the school is doing in ${currentTerm.name}.`
            : "What needs your attention today, and how your school is put together."
        }
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
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          mb: 4,
        }}
      >
        <StatCard
          label="Attendance this term"
          value={termRate === null ? "—" : `${termRate}%`}
          hint="present entries over all registers"
          primary
        />
        <StatCard
          label="Average mark"
          value={avgMark === null ? "—" : `${avgMark}`}
          hint="across every recorded mark"
        />
        <StatCard
          label="Pupils at risk"
          value={atRisk.length}
          hint="meet the configured rule"
          tone={atRisk.length > 0 ? "warning" : "neutral"}
        />
        <StatCard label="Pupils on roll" value={stats.students} hint={`${stats.teachers} teachers`} />
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
              description="Every class has attendance recorded, every subject has a teacher, there are no open complaints and no pupil is at risk. The school is fully covered today."
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

      <Box sx={{ mb: 4 }}>
        <ChartCard
          category="Attendance"
          title="Attendance rate by class, weakest first"
          description="Every class, ordered so the one needing help is at the top."
          empty={rateByClass.length === 0}
          emptyMessage="No attendance has been recorded yet this term."
          minHeight={Math.max(220, rateByClass.length * 44)}
        >
          <QuestionBarChart
            data={rateByClass}
            question="Attendance rate by class, weakest first"
            unit="%"
            horizontal
            color="#083E28"
            height={Math.max(220, rateByClass.length * 44)}
          />
        </ChartCard>
      </Box>

      <Box id="pupils-at-risk" sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="h6">Pupils at risk</Typography>
            <Typography variant="caption" color="text.secondary">
              Attendance below the school&apos;s threshold, or weak marks in several subjects.
            </Typography>
          </Box>
        </Box>

        {atRisk.length === 0 ? (
          <Paper variant="outlined">
            <EmptyState
              title="Nobody at risk"
              description="No pupil currently meets the at-risk rule the school has configured."
            />
          </Paper>
        ) : (
          <DataTable
            rows={atRiskRows}
            csvName="at-risk-pupils"
            columns={[
              { key: "pupil", label: "Pupil" },
              { key: "class", label: "Class" },
              { key: "campus", label: "Campus" },
              { key: "roll", label: "Roll", type: "number", align: "right" },
              { key: "reason", label: "Why" },
            ]}
          />
        )}
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
        <ChartCard
          category="Enrolment"
          title="Pupils by campus"
          description="Where the roll sits across the school's campuses."
          empty={campusData.length === 0}
          emptyMessage="No pupils are enrolled yet."
        >
          <QuestionBarChart
            data={campusData}
            question="Pupils enrolled at each campus"
            unit="pupils"
            color="#3D9C6A"
            height={Math.max(160, campusData.length * 56)}
          />
        </ChartCard>

        <ChartCard
          category="Enrolment"
          title="New pupils by term"
          description="Based on when each pupil's record was created — an enrolment date, not an admissions funnel."
          empty={enrolmentData.length === 0}
          emptyMessage="No terms have been set up yet."
        >
          <QuestionBarChart
            data={enrolmentData}
            question="Pupils whose record was created in each term"
            unit="pupils"
            color="#6B8F7A"
            height={220}
          />
        </ChartCard>
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
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h6">Subjects per teacher</Typography>
              <Typography variant="caption" color="text.secondary">
                How many subjects each teacher owns. Periods per week are not recorded.
              </Typography>
            </Box>
          </Box>

          {teacherRows.length === 0 ? (
            <Paper variant="outlined">
              <EmptyState
                title="No subjects assigned"
                description="Once subjects are assigned to teachers, their load appears here."
              />
            </Paper>
          ) : (
            <DataTable
              rows={teacherRows}
              csvName="teacher-subject-load"
              columns={[
                { key: "teacher", label: "Teacher" },
                { key: "subjects", label: "Subjects", type: "number", align: "right" },
              ]}
              initialSortKey="subjects"
              initialSortDirection="desc"
              pageSize={10}
            />
          )}
        </Box>

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
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          alignItems: "start",
        }}
      >
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
      </Box>
    </>
  );
}
