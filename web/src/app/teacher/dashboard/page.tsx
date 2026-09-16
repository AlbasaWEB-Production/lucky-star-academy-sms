import { Suspense } from "react";
import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import QuestionBarChart from "@/components/charts/QuestionBarChart";
import AttendanceHeatmap from "@/components/dashboard/AttendanceHeatmap";
import ChartCard from "@/components/dashboard/ChartCard";
import DataTable from "@/components/dashboard/DataTable";
import UrlFilterSelect from "@/components/dashboard/UrlFilterSelect";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import {
  getCurrentTerm,
  getDashboardThresholds,
  getGradeDistribution,
  listAtRiskPupils,
  listAttendanceRateByClass,
  listClassAttendanceHeatmap,
  listMarksByClassSubject,
  overallAttendanceRate,
  overallAverageMark,
} from "@/lib/data/dashboard";
import {
  getOwnTeacherAssignments,
  listAttendanceCoverageForTeacher,
  listNotices,
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
export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; subject?: string }>;
}) {
  const session = await requireRoleWithTenant("teacher");
  const { class: classParam = "", subject: subjectParam = "" } = await searchParams;
  const today = localIsoDate(new Date());

  const [assignments, coverage, rate, marksBySubject, notices, thresholds, atRisk, currentTerm] =
    await Promise.all([
      getOwnTeacherAssignments(session.id),
      listAttendanceCoverageForTeacher(session.id, today),
      listAttendanceRateByClass(),
      listMarksByClassSubject(),
      listNotices(),
      getDashboardThresholds(),
      listAtRiskPupils(),
      getCurrentTerm(),
    ]);

  const attendanceToday = coverage.map((row) => ({
    name: row.className,
    value: row.recordedCount,
  }));

  const classesStillToDo = coverage.filter((row) => row.recordedCount === 0);

  const attendanceRate = rate.map((row) => ({
    name: row.className,
    value: row.ratePercent,
  }));

  // A teacher's classes and subjects, in name order, for the two selectors.
  const teacherClasses = [...new Set(assignments.map((a) => a.classId))].map((classId) => {
    const first = assignments.find((a) => a.classId === classId)!;
    return { id: classId, name: first.className };
  });
  const teacherClassesSorted = teacherClasses.sort((a, b) => a.name.localeCompare(b.name));

  const selectedClassId =
    teacherClassesSorted.find((c) => c.id === classParam)?.id ?? teacherClassesSorted[0]?.id ?? "";

  const teacherSubjects = assignments.map((a) => ({ id: a.subjectId, name: a.subjectName })).sort(
    (a, b) => a.name.localeCompare(b.name),
  );
  const selectedSubjectId =
    teacherSubjects.find((s) => s.id === subjectParam)?.id ?? teacherSubjects[0]?.id ?? "";

  const sortedAssignments = [...assignments].sort(
    (a, b) => a.className.localeCompare(b.className) || a.subjectName.localeCompare(b.subjectName),
  );

  const recentNotices = notices.slice(0, 5);

  // The term-scoped reads depend on the selectors, so they come after the batch
  // above. `since` bounds the heat map to the current term.
  const [heatmap, gradeBuckets] = await Promise.all([
    selectedClassId
      ? listClassAttendanceHeatmap(selectedClassId, { since: currentTerm?.startDate })
      : Promise.resolve([]),
    selectedSubjectId
      ? getGradeDistribution(selectedSubjectId, thresholds.gradeBands)
      : Promise.resolve([]),
  ]);

  const termRate = overallAttendanceRate(rate);
  const totalRegisters = rate.reduce((sum, row) => sum + row.totalRegisters, 0);

  const avgMark = overallAverageMark(marksBySubject);
  const markPupils = marksBySubject.reduce((sum, row) => sum + row.studentCount, 0);

  const gradeData = gradeBuckets.map((bucket) => ({ name: bucket.grade, value: bucket.count }));
  const gradeCount = gradeBuckets.reduce((sum, bucket) => sum + bucket.count, 0);

  const atRiskRows = atRisk.map((pupil) => ({
    pupil: pupil.studentName,
    class: pupil.className,
    campus: pupil.campus ?? "—",
    roll: pupil.rollNumber,
    reason: pupil.reason,
  }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={
          currentTerm
            ? `Your classes in ${currentTerm.name}, what still needs marking today, and the latest notices.`
            : "Your classes, what still needs marking today, and the latest notices."
        }
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
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          mb: 4,
        }}
      >
        <StatCard
          label="Attendance this term"
          value={termRate === null ? "—" : `${termRate}%`}
          hint={`across ${totalRegisters} register entries`}
          primary
        />
        <StatCard
          label="Average mark"
          value={avgMark === null ? "—" : `${avgMark}`}
          hint={`across ${markPupils} pupils`}
        />
        <StatCard
          label="Pupils at risk"
          value={atRisk.length}
          hint="meet the configured rule"
          tone={atRisk.length > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Classes to mark today"
          value={classesStillToDo.length}
          hint={classesStillToDo.length === 0 ? "All marked" : "still to do"}
          tone={classesStillToDo.length === 0 ? "neutral" : "warning"}
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
          gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
          alignItems: "start",
          mb: 4,
        }}
      >
        <ChartCard
          category="Attendance"
          title="Pupil-by-day attendance"
          description={`Who is drifting, day by day${currentTerm ? ` in ${currentTerm.name}` : ""}.`}
          filter={
            teacherClassesSorted.length > 1 ? (
              <Suspense fallback={null}>
                <ClassSelector classes={teacherClassesSorted} value={selectedClassId} />
              </Suspense>
            ) : null
          }
          empty={selectedClassId === ""}
          emptyMessage="Assign a class to a subject to see its attendance grid."
          minHeight={300}
        >
          {selectedClassId ? <AttendanceHeatmap cells={heatmap} /> : null}
        </ChartCard>

        <ChartCard
          category="Marks"
          title="Grade distribution"
          description={`${gradeCount} marks recorded for the selected subject.`}
          filter={
            teacherSubjects.length > 0 ? (
              <Suspense fallback={null}>
                <SubjectSelector subjects={teacherSubjects} value={selectedSubjectId} />
              </Suspense>
            ) : null
          }
          empty={selectedSubjectId === ""}
          emptyMessage="Assign a subject to see how pupils are performing in it."
        >
          <QuestionBarChart
            data={gradeData}
            question="Pupils per grade for the selected subject"
            unit="pupils"
            color="#F2B705"
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
            <Typography variant="h6">Pupils at risk</Typography>
          </Box>

          {atRisk.length === 0 ? (
            <Paper variant="outlined">
              <EmptyState
                title="Nobody at risk"
                description="No pupil meets the at-risk rule. The rule is set by the school in the configuration."
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
    </>
  );
}

/** Class picker for the heat map; the URL is the state. */
function ClassSelector({
  classes,
  value,
}: {
  classes: { id: string; name: string }[];
  value: string;
}) {
  return (
    <UrlFilterSelect
      name="class"
      label="Class"
      value={value}
      options={classes.map((c) => ({ value: c.id, label: c.name }))}
    />
  );
}

/** Subject picker for the grade distribution; the URL is the state. */
function SubjectSelector({
  subjects,
  value,
}: {
  subjects: { id: string; name: string }[];
  value: string;
}) {
  return (
    <UrlFilterSelect
      name="subject"
      label="Subject"
      value={value}
      options={subjects.map((s) => ({ value: s.id, label: s.name }))}
    />
  );
}
