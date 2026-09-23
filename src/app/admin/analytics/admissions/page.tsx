import Link from "@/components/NextLink";
import { Box, Button, Typography } from "@mui/material";

import ChartCard from "@/components/dashboard/ChartCard";
import DataTable from "@/components/dashboard/DataTable";
import AdmissionsFunnelChart from "@/components/charts/AdmissionsFunnelChart";
import NewEnrolmentsByIntakeChart from "@/components/charts/NewEnrolmentsByIntakeChart";
import CapacityUtilisationChart from "@/components/charts/CapacityUtilisationChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import {
  listAdmissionsFunnel,
  listNewEnrolmentsByClassIntake,
  listCapacityUtilisation,
} from "@/lib/data/admissions";
import { stageLabel } from "@/lib/admissions";

export const metadata = {
  title: "Admissions analytics",
};

/**
 * The admissions funnel, where new pupils landed, and how full each class is.
 *
 * All three come from the `security_invoker` views in
 * `20260101000700_admissions_capacity.sql`, each gated in-view to
 * `jwt_role() = 'admin'`. A class with no capacity set has a null
 * `utilisationPercent` — shown as a dash, not a fabricated number. With few
 * leads the charts are honest and mostly empty; recording enquiries on the
 * admissions screen is what fills them.
 */
export default async function AdmissionsAnalyticsPage() {
  const [funnel, newEnrolments, capacity] = await Promise.all([
    listAdmissionsFunnel(),
    listNewEnrolmentsByClassIntake(),
    listCapacityUtilisation(),
  ]);

  const totalLeads = funnel.reduce((sum, row) => sum + row.leads, 0);
  const enrolledLeads = funnel.find((row) => row.stage === "enrolled")?.leads ?? 0;
  const enrolmentRate = totalLeads > 0 ? Math.round((enrolledLeads / totalLeads) * 100) : 0;

  const classesWithCapacity = capacity.filter((row) => row.capacity !== null).length;
  const overCapacity = capacity.filter(
    (row) => row.capacity !== null && row.pupilCount > (row.capacity ?? 0),
  ).length;

  const funnelChartData = funnel.map((row) => ({
    stage: row.stage,
    leads: row.leads,
    conversionPercent: row.conversionPercent,
  }));

  const funnelTableRows = funnel.map((row) => ({
    stage: stageLabel(row.stage),
    leads: row.leads,
    percent: `${row.conversionPercent}%`,
  }));

  const enrolmentChartData = newEnrolments.map((row) => ({
    className: row.className,
    termName: row.termName,
    enrolled: row.enrolled,
  }));

  const enrolmentTableRows = newEnrolments.map((row) => ({
    class: row.className,
    campus: row.campus ?? "—",
    term: row.termName ?? "No term set",
    enrolled: row.enrolled,
  }));

  const capacityChartData = capacity.map((row) => ({
    className: row.className,
    pupilCount: row.pupilCount,
    capacity: row.capacity,
  }));

  const capacityTableRows = capacity.map((row) => ({
    class: row.className,
    campus: row.campus ?? "—",
    pupils: row.pupilCount,
    capacity: row.capacity ?? "—",
    utilisation:
      row.utilisationPercent === null ? "—" : `${row.utilisationPercent}%`,
  }));

  return (
    <>
      <PageHeader
        title="Admissions analytics"
        subtitle="How the enrolment pipeline is converting, which classes new pupils are joining, and how full each class is."
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
          label="Pipeline leads"
          value={totalLeads}
          hint="all recorded enquiries"
          primary
        />
        <StatCard
          label="Enrolled"
          value={enrolledLeads}
          hint="reached enrolled stage"
          tone={enrolledLeads > 0 ? "deepGreen" : "neutral"}
        />
        <StatCard
          label="Enrolment rate"
          value={`${enrolmentRate}%`}
          hint="of all leads that enrolled"
          tone={enrolmentRate >= 50 ? "deepGreen" : enrolmentRate > 0 ? "gold" : "warning"}
        />
        <StatCard
          label="Classes at capacity"
          value={`${classesWithCapacity} of ${capacity.length}`}
          hint={overCapacity > 0 ? `${overCapacity} over capacity` : "none over capacity"}
          tone={overCapacity > 0 ? "warning" : "deepGreen"}
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
          category="Pipeline"
          title="Admissions funnel by stage"
          description="How many leads sit in each stage, and their share of all leads."
          empty={funnel.length === 0}
          emptyMessage="Record an enquiry on the admissions screen to fill this."
          minHeight={320}
        >
          <AdmissionsFunnelChart data={funnelChartData} height={320} />
        </ChartCard>

        <ChartCard
          category="Enrolment"
          title="New enrolments by class and intake"
          description="Enrolled leads per class, split by the term they were targeting."
          empty={enrolmentChartData.length === 0}
          emptyMessage="Advance a lead to enrolled on the admissions screen to fill this."
          minHeight={320}
        >
          <NewEnrolmentsByIntakeChart data={enrolmentChartData} height={320} />
        </ChartCard>
      </Box>

      <ChartCard
        category="Capacity"
        title="Capacity utilisation by class"
        description="Active pupils as a bar against each class's capacity line. A class with no capacity set shows no line."
        empty={capacityChartData.length === 0}
        emptyMessage="No classes yet. Create a class and set its capacity to fill this."
        minHeight={320}
      >
        <CapacityUtilisationChart data={capacityChartData} height={320} />
      </ChartCard>

      <Typography variant="h6" sx={{ mt: 4, mb: 0.5 }}>
        Pipeline by stage
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        The share is the percentage of all recorded leads currently in that stage.
      </Typography>
      <Box sx={{ mb: 4 }}>
        <DataTable
          rows={funnelTableRows}
          csvName="admissions-funnel"
          columns={[
            { key: "stage", label: "Stage" },
            { key: "leads", label: "Leads", type: "number", align: "right" },
            { key: "percent", label: "Share of all leads", align: "right" },
          ]}
          initialSortKey="stage"
          initialSortDirection="asc"
          pageSize={10}
        />
      </Box>

      <Typography variant="h6" sx={{ mb: 0.5 }}>
        New enrolments by class and intake
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Enrolled leads grouped by the class they joined and the term they targeted.
      </Typography>
      <Box sx={{ mb: 4 }}>
        {enrolmentTableRows.length > 0 ? (
          <DataTable
            rows={enrolmentTableRows}
            csvName="new-enrolments-by-class-intake"
            columns={[
              { key: "class", label: "Class" },
              { key: "campus", label: "Campus" },
              { key: "term", label: "Intake term" },
              { key: "enrolled", label: "Enrolled", type: "number", align: "right" },
            ]}
            initialSortKey="class"
            initialSortDirection="asc"
            pageSize={10}
          />
        ) : (
          <EmptyState
            title="No enrolments recorded yet"
            description="Advance an enquiry to the enrolled stage on the admissions screen and choose the class — it will appear here."
          />
        )}
      </Box>

      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Capacity utilisation
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Active pupils against each class's capacity. A dash means the class has no capacity set.
      </Typography>
      <Box sx={{ mb: 2 }}>
        <DataTable
          rows={capacityTableRows}
          csvName="capacity-utilisation"
          columns={[
            { key: "class", label: "Class" },
            { key: "campus", label: "Campus" },
            { key: "pupils", label: "Active pupils", type: "number", align: "right" },
            { key: "capacity", label: "Capacity", type: "number", align: "right" },
            { key: "utilisation", label: "Utilisation", align: "right" },
          ]}
          initialSortKey="class"
          initialSortDirection="asc"
          pageSize={10}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        <Button component={Link} href="/admin/admissions" variant="outlined">
          Record an enquiry
        </Button>
        <Button component={Link} href="/admin/classes" variant="outlined">
          Set class capacity
        </Button>
      </Box>
    </>
  );
}
