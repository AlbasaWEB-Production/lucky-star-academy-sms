import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";

import QuestionBarChart from "@/components/charts/QuestionBarChart";
import { CHART_COLORS } from "@/components/charts/tokens";
import ChartCard from "@/components/dashboard/ChartCard";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import TableShell from "@/components/ui/TableShell";
import {
  listSlotCountsBySubject,
  listUnscheduledSubjects,
  summariseTimetableCoverage,
} from "@/lib/data/timetable";

export const metadata = {
  title: "Dashboard",
};

/** How many subjects the attention panel lists before it links out. */
const ATTENTION_LIMIT = 6;

/**
 * The schedule officer's home screen.
 *
 * The question it answers is "how much of the timetable is built, and what is
 * still waiting to be placed?" - a subject with no slot is the only real gap
 * this schema can express, so it is the hero of the page and the same test the
 * header feed makes in `@/lib/data/header`, which is why the bell and this page
 * always agree.
 *
 * Every number below is counted from a read in `@/lib/data/timetable`; nothing
 * is estimated. The schema has no periods-per-week figure, so coverage is
 * counted in *subjects placed*, not in hours, and a subject counts as placed
 * once it holds one or more slots.
 *
 * No role check: the `/schedule` layout has already loaded the shell context,
 * and RLS scopes the reads.
 */
export default async function ScheduleDashboardPage() {
  const [coverage, unscheduled, slotCounts] = await Promise.all([
    summariseTimetableCoverage(),
    listUnscheduledSubjects(),
    listSlotCountsBySubject(),
  ]);

  const subjectTotal = coverage.reduce((sum, row) => sum + row.subjectCount, 0);
  const scheduledTotal = coverage.reduce((sum, row) => sum + row.scheduledCount, 0);
  const lessonsPlaced = slotCounts.reduce((sum, row) => sum + row.slotCount, 0);

  const classesWithSubjects = coverage.filter((row) => row.subjectCount > 0);
  const classesFullyScheduled = classesWithSubjects.filter(
    (row) => row.scheduledCount === row.subjectCount,
  );

  const overallCoverage =
    subjectTotal > 0 ? Math.round((scheduledTotal / subjectTotal) * 1000) / 10 : 0;

  const coverageData = classesWithSubjects.map((row) => ({
    name: row.className,
    value: row.percentage,
  }));

  const attention = unscheduled.slice(0, ATTENTION_LIMIT);
  const remaining = unscheduled.length - attention.length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="How much of the week is built, and which subjects still have no place in it."
        action={
          <Button component={Link} href="/schedule/timetable" variant="contained">
            Open the timetable
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
          label="Timetable coverage"
          value={subjectTotal > 0 ? `${overallCoverage}%` : "—"}
          hint={
            subjectTotal > 0
              ? `${scheduledTotal} of ${subjectTotal} subjects placed`
              : "No subjects to place yet"
          }
          primary
        />
        <StatCard
          label="Subjects without a slot"
          value={unscheduled.length}
          hint={unscheduled.length === 0 ? "Every subject is placed" : "still to place"}
          tone={unscheduled.length > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Lessons in the week"
          value={lessonsPlaced}
          hint={`across ${classesWithSubjects.length} class${classesWithSubjects.length === 1 ? "" : "es"}`}
        />
        <StatCard
          label="Classes fully scheduled"
          value={`${classesFullyScheduled.length} of ${classesWithSubjects.length}`}
          hint="every subject has at least one slot"
          tone={
            classesWithSubjects.length > 0 &&
            classesFullyScheduled.length === classesWithSubjects.length
              ? "neutral"
              : "warning"
          }
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
          category="Coverage"
          title="Subjects placed, by class"
          description="The share of each class's subjects that holds at least one slot in the week."
          empty={coverageData.length === 0}
          emptyMessage="No class has subjects yet, so there is nothing to cover. An administrator creates classes and their subjects."
          minHeight={Math.max(220, coverageData.length * 44)}
        >
          <QuestionBarChart
            data={coverageData}
            question="Share of each class's subjects that is placed in the week"
            unit="%"
            horizontal
            color={CHART_COLORS[0]}
            height={Math.max(220, coverageData.length * 44)}
          />
        </ChartCard>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary">
            Needs attention
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {unscheduled.length === 0
              ? "Every subject is placed"
              : `${unscheduled.length} subject${unscheduled.length === 1 ? "" : "s"} with no slot`}
          </Typography>

          {unscheduled.length === 0 ? (
            <EmptyState
              title="Nothing is waiting"
              description="Every subject in the school holds at least one slot in the week. New subjects appear here as soon as an administrator creates them."
            />
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {attention.map((subject) => (
                <Box
                  key={subject.subjectId}
                  component={Link}
                  href={`/schedule/timetable?class=${subject.classId}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                  sx={{
                    display: "block",
                    p: 1.5,
                    borderRadius: "12px",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <Typography variant="subtitle2">{subject.subjectName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {`${subject.className} · ${subject.teacherName ?? "no teacher yet"}`}
                  </Typography>
                </Box>
              ))}

              {remaining > 0 ? (
                <Typography variant="caption" color="text.secondary">
                  {`and ${remaining} more`}
                </Typography>
              ) : null}

              <Button
                component={Link}
                href="/schedule/timetable"
                variant="outlined"
                size="small"
                sx={{ mt: 1, alignSelf: "flex-start" }}
              >
                Place a lesson
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="h6">Coverage by class</Typography>
            <Typography variant="caption" color="text.secondary">
              A subject counts as placed once it holds at least one slot. Periods per week are not
              recorded in this schema, so coverage is counted in subjects.
            </Typography>
          </Box>
        </Box>

        <TableShell
          headers={["Class", "Subjects", "Placed", "Coverage", ""]}
          density="compact"
          columnAlign={["left", "right", "right", "right", "left"]}
          isEmpty={coverage.length === 0}
          emptyMessage="No classes yet. An administrator creates classes and their subjects; once they exist, their timetable coverage appears here."
        >
          {coverage.map((row) => (
            <TableRow key={row.classId}>
              <TableCell>{row.className}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {row.subjectCount}
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {row.scheduledCount}
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {row.subjectCount > 0 ? `${row.percentage}%` : "—"}
              </TableCell>
              <TableCell>
                <Button
                  component={Link}
                  href={`/schedule/timetable?class=${row.classId}`}
                  size="small"
                  variant="outlined"
                >
                  View week
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>
      </Box>
    </>
  );
}
