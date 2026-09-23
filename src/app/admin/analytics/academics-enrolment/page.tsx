import Link from "@/components/NextLink";
import { Box, Button } from "@mui/material";

import ChartCard from "@/components/dashboard/ChartCard";
import DataTable from "@/components/dashboard/DataTable";
import EnrolmentTrendChart from "@/components/charts/EnrolmentTrendChart";
import RetentionDropoutChart from "@/components/charts/RetentionDropoutChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import {
  listEnrolmentTrendByClassCampus,
  listRetentionDropout,
} from "@/lib/data/academics";
import { getCurrentTerm } from "@/lib/data/dashboard";

export const metadata = {
  title: "Enrolment analytics",
};

/**
 * Enrolment trend by class and campus, plus retention/dropout.
 *
 * Everything here reads `students.enrolled_at` / `enrolment_status` /
 * `status_date` through the security_invoker views in
 * `20260101000500_deepen_academics.sql`, so RLS scopes the rows: an admin sees
 * the whole school; a teacher sees where they teach. Pupils whose enrolment
 * date is unknown are not guessed into a term, so the per-term totals can be
 * lower than the roll — the charts say "enrolled", never "total".
 */
export default async function AcademicsEnrolmentPage() {
  const [enrolment, retention, currentTerm] = await Promise.all([
    listEnrolmentTrendByClassCampus(),
    listRetentionDropout(),
    getCurrentTerm(),
  ]);

  // Roll the enrolment trend up into the campus-line chart the component draws.
  const trendData = enrolment.map((row) => ({
    termName: row.termName,
    campus: row.campus,
    enrolled: row.enrolled,
  }));

  const retentionData = retention.map((row) => ({
    termName: row.termName,
    retained: row.retained,
    leftSchool: row.leftSchool,
  }));

  const totalEnrolled = enrolment.reduce((sum, row) => sum + row.enrolled, 0);

  // KPIs read the current term when it has a recorded status change; otherwise
  // they fall back to the most recent term that does (an honest "last recorded").
  const currentRetention =
    (currentTerm && retention.find((row) => row.termId === currentTerm.id)) ??
    retention[retention.length - 1] ??
    null;

  const tableRows = enrolment.map((row) => ({
    class: row.className,
    campus: row.campus ?? "—",
    term: row.termName,
    enrolled: row.enrolled,
  }));

  const retentionRows = retention.map((row) => ({
    term: row.termName,
    retained: row.retained,
    left: row.leftSchool,
    changes: row.changesTotal,
    retentionRate:
      row.retentionRatePercent === null ? null : Number(row.retentionRatePercent.toFixed(1)),
  }));

  return (
    <>
      <PageHeader
        title="Enrolment analytics"
        subtitle="Who joined and who stayed, term by term, across the school's campuses."
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
          label="Enrolled (all terms)"
          value={totalEnrolled}
          hint="pupils with an enrolment date in a term"
          primary
        />
        <StatCard
          label="Retained this term"
          value={currentRetention ? currentRetention.retained : "—"}
          hint="active or completed, status changed this term"
          tone={currentRetention && currentRetention.retained > 0 ? "deepGreen" : "neutral"}
        />
        <StatCard
          label="Left this term"
          value={currentRetention ? currentRetention.leftSchool : "—"}
          hint="withdrawn or transferred, status changed this term"
          tone={currentRetention && currentRetention.leftSchool > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Retention rate"
          value={currentRetention?.retentionRatePercent ?? "—"}
          hint={`${currentTerm ? currentTerm.name : "last recorded"} · retained over changes`}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "3fr 2fr" },
          alignItems: "start",
          mb: 4,
        }}
      >
        <ChartCard
          category="Enrolment"
          title="Pupils enrolled each term, by campus"
          description="Only pupils with a real enrolment date in a term window are counted."
          empty={trendData.length === 0}
          emptyMessage="No pupils have an enrolment date inside a term yet. Set a pupil's enrolled date on their student record to fill this."
          minHeight={320}
        >
          <EnrolmentTrendChart data={trendData} height={320} />
        </ChartCard>

        <ChartCard
          category="Retention"
          title="Retained vs pupils who left, per term"
          description="Counted in the term where each pupil's status last changed."
          empty={retentionData.length === 0}
          emptyMessage="No pupil has had an enrolment status change yet. Change a pupil's status on their student record to fill this."
          minHeight={320}
        >
          <RetentionDropoutChart data={retentionData} height={320} />
        </ChartCard>
      </Box>

      <Box sx={{ mb: 4 }}>
        <DataTable
          rows={tableRows}
          csvName="enrolment-trend-by-class-campus"
          columns={[
            { key: "class", label: "Class" },
            { key: "campus", label: "Campus" },
            { key: "term", label: "Term" },
            { key: "enrolled", label: "Enrolled", type: "number", align: "right" },
          ]}
          initialSortKey="term"
          initialSortDirection="asc"
          pageSize={10}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <DataTable
          rows={retentionRows}
          csvName="retention-dropout-per-term"
          columns={[
            { key: "term", label: "Term" },
            { key: "retained", label: "Retained", type: "number", align: "right" },
            { key: "left", label: "Left school", type: "number", align: "right" },
            { key: "changes", label: "Changes", type: "number", align: "right" },
            { key: "retentionRate", label: "Retention rate", type: "percent", align: "right" },
          ]}
          initialSortKey="term"
          initialSortDirection="asc"
          pageSize={10}
        />
      </Box>

      {currentTerm ? (
        <Box sx={{ mb: 2 }}>
          <Button component={Link} href="/admin/students" variant="outlined">
            Manage student enrolment
          </Button>
        </Box>
      ) : (
        <Box sx={{ mb: 2 }}>
          <EmptyState
            title="No terms set up yet"
            description="The enrolment and retention charts need a term calendar. Once a term is created these figures fill in; the tables above stay honest and empty until then."
          />
        </Box>
      )}
    </>
  );
}
