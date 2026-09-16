import Link from "@/components/NextLink";
import { Box, Button, Typography } from "@mui/material";

import ChartCard from "@/components/dashboard/ChartCard";
import DataTable from "@/components/dashboard/DataTable";
import PupilTeacherRatioChart from "@/components/charts/PupilTeacherRatioChart";
import TeacherAttendanceRateChart from "@/components/charts/TeacherAttendanceRateChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import {
  listPupilTeacherRatio,
  listTeacherAttendanceRate,
  listUncoveredSubjects,
} from "@/lib/data/people";
import { getCurrentTerm, listTeacherSubjectLoad } from "@/lib/data/dashboard";

export const metadata = {
  title: "People analytics",
};

/**
 * How staffed each class is, and how reliable teaching attendance is.
 *
 * The pupil–teacher ratio and teacher attendance rate come from the
 * `security_invoker` views in `20260101000600_people_teaching.sql`, both gated
 * in-view to `jwt_role() = 'admin'`; subject load is the existing
 * `v_teacher_subject_load`; uncovered subjects read `subjects` directly. RLS
 * scopes every row to this school, so an admin sees the whole school's staffing
 * picture at once.
 *
 * A class with no teacher has a null ratio, and a teacher with no recorded
 * days a null attendance rate — both shown honestly ("no teacher", "no records
 * yet") rather than as a fabricated 0.
 */
export default async function PeopleAnalyticsPage() {
  const [ratio, attendance, uncovered, subjectLoad, currentTerm] = await Promise.all([
    listPupilTeacherRatio(),
    listTeacherAttendanceRate(),
    listUncoveredSubjects(),
    listTeacherSubjectLoad(),
    getCurrentTerm(),
  ]);

  const ratioData = ratio.map((row) => ({
    className: row.className,
    campus: row.campus,
    ratio: row.ratio,
  }));

  const attendanceData = attendance.map((row) => ({
    teacherName: row.teacherName,
    ratePercent: row.ratePercent,
  }));

  const ratioTableRows = ratio.map((row) => ({
    class: row.className,
    campus: row.campus ?? "—",
    pupils: row.pupilCount,
    teachers: row.teacherCount,
    ratio: row.ratio,
  }));

  const attendanceTableRows = attendance.map((row) => ({
    teacher: row.teacherName,
    recorded: row.recordedDays,
    present: row.presentTotal,
    absent: row.absentTotal,
    rate: row.ratePercent,
  }));

  const subjectLoadRows = subjectLoad.map((row) => ({
    teacher: row.teacherName,
    subjects: row.subjectCount,
  }));

  const uncoveredTableRows = uncovered.map((row) => ({
    subject: row.subjectName,
    code: row.code,
    class: row.className,
    campus: row.campus ?? "—",
  }));

  const coveredClasses = ratio.filter((row) => row.teacherCount > 0).length;

  // Mean of the attendance rates teachers actually have recorded. A teacher
  // with no records has a null rate; excluding them is the honest reading of
  // "reliability" rather than averaging a hole into a number.
  const recordedRates = attendance
    .map((row) => row.ratePercent)
    .filter((rate): rate is number => rate !== null);
  const averageAttendance =
    recordedRates.length > 0
      ? Math.round((recordedRates.reduce((sum, rate) => sum + rate, 0) / recordedRates.length) * 10) / 10
      : null;

  const attendanceTone =
    averageAttendance === null
      ? "neutral"
      : averageAttendance >= 80
        ? "deepGreen"
        : averageAttendance >= 60
          ? "gold"
          : "warning";

  return (
    <>
      <PageHeader
        title="People analytics"
        subtitle="How staffed each class is, who is teaching what, and how reliable teaching attendance is."
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
          label="Classes"
          value={ratio.length}
          hint="timetabled classes"
          primary
        />
        <StatCard
          label="Classes with a teacher"
          value={`${coveredClasses} of ${ratio.length}`}
          hint="have at least one subject assigned"
          tone={coveredClasses === ratio.length && ratio.length > 0 ? "deepGreen" : "warning"}
        />
        <StatCard
          label="Uncovered subjects"
          value={uncovered.length}
          hint="subjects with no teacher yet"
          tone={uncovered.length > 0 ? "warning" : "deepGreen"}
        />
        <StatCard
          label="Avg teacher attendance"
          value={averageAttendance === null ? "—" : `${averageAttendance}%`}
          hint={currentTerm ? `${currentTerm.name} · recorded days` : "current term · recorded days"}
          tone={attendanceTone}
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
        <ChartCard
          category="Staffing"
          title="Pupils per teacher, by class"
          description="A missing bar is a class with no teacher assigned — a gap, not zero staff."
          empty={ratioData.length === 0}
          emptyMessage="No classes yet. Create a class and enrol pupils to fill this."
          minHeight={320}
        >
          <PupilTeacherRatioChart data={ratioData} height={320} />
        </ChartCard>

        <ChartCard
          category="Teaching"
          title="Teacher attendance this term"
          description="Present share of recorded days; a teacher with no records is not drawn."
          empty={attendanceData.length === 0}
          emptyMessage="No teacher attendance recorded yet. Record it on the attendance screen to fill this."
          minHeight={320}
        >
          <TeacherAttendanceRateChart data={attendanceData} height={320} />
        </ChartCard>
      </Box>

      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Pupil–teacher ratio by class
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Active pupils per distinct teachers teaching that class. A dash in the ratio column means the class has no teacher yet.
      </Typography>
      <Box sx={{ mb: 4 }}>
        <DataTable
          rows={ratioTableRows}
          csvName="pupil-teacher-ratio-by-class"
          columns={[
            { key: "class", label: "Class" },
            { key: "campus", label: "Campus" },
            { key: "pupils", label: "Pupils", type: "number", align: "right" },
            { key: "teachers", label: "Teachers", type: "number", align: "right" },
            { key: "ratio", label: "Pupils per teacher", type: "number", align: "right" },
          ]}
          initialSortKey="class"
          initialSortDirection="asc"
          pageSize={10}
        />
      </Box>

      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Subject load per teacher
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        How many subjects each teacher is assigned to, most loaded first.
      </Typography>
      <Box sx={{ mb: 4 }}>
        <DataTable
          rows={subjectLoadRows}
          csvName="subject-load-per-teacher"
          columns={[
            { key: "teacher", label: "Teacher" },
            { key: "subjects", label: "Subjects", type: "number", align: "right" },
          ]}
          initialSortKey="subjects"
          initialSortDirection="desc"
          pageSize={10}
        />
      </Box>

      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Classes without a teacher for a subject
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Subjects where no teacher is assigned yet, so a class has a gap it needs covering.
      </Typography>
      <Box sx={{ mb: 4 }}>
        {uncoveredTableRows.length > 0 ? (
          <DataTable
            rows={uncoveredTableRows}
            csvName="uncovered-subjects"
            columns={[
              { key: "subject", label: "Subject" },
              { key: "code", label: "Code" },
              { key: "class", label: "Class" },
              { key: "campus", label: "Campus" },
            ]}
            initialSortKey="class"
            initialSortDirection="asc"
            pageSize={10}
          />
        ) : (
          <EmptyState
            title="Every subject has a teacher"
            description="Nothing to cover right now. Assign a teacher to a subject on the subjects screen and any new gap will show here."
          />
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        <Button component={Link} href="/admin/subjects" variant="outlined">
          Assign teachers
        </Button>
        <Button component={Link} href="/admin/attendance" variant="outlined">
          Record teacher attendance
        </Button>
      </Box>
    </>
  );
}
