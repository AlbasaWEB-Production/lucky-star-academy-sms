import Link from "@/components/NextLink";
import { Box, Button, Typography } from "@mui/material";

import ChartCard from "@/components/dashboard/ChartCard";
import DataTable from "@/components/dashboard/DataTable";
import IncidentsByTypeChart from "@/components/charts/IncidentsByTypeChart";
import IncidentsPerHundredByClassChart from "@/components/charts/IncidentsPerHundredByClassChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { listIncidentsByType, listIncidentsPerHundredByClass } from "@/lib/data/welfare";
import { incidentTypeLabel } from "@/lib/incidents";

export const metadata = {
  title: "Welfare analytics",
};

/**
 * The welfare picture: incidents by type, and incidents per hundred active
 * pupils by class.
 *
 * Both come from the `security_invoker` views in
 * `20260101000800_welfare_incidents.sql`, each gated in-view to
 * `jwt_role() = 'admin'`. A class with no active pupils has a null `perHundred`
 * — shown as a dash, never a fabricated number. With few records the charts are
 * honest and mostly empty; recording incidents on the incident register is what
 * fills them.
 */
export default async function WelfareAnalyticsPage() {
  await requireRoleWithTenant("admin");

  const [byType, perHundred] = await Promise.all([
    listIncidentsByType(),
    listIncidentsPerHundredByClass(),
  ]);

  const totalIncidents = byType.reduce((sum, row) => sum + row.incidentCount, 0);
  const openIncidents = byType.reduce((sum, row) => sum + row.unresolvedCount, 0);
  const resolvedIncidents = byType.reduce((sum, row) => sum + row.resolvedCount, 0);
  const resolvedRate = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0;

  const classesWithRate = perHundred.filter((row) => row.perHundred !== null).length;

  const byTypeChartData = byType.map((row) => ({
    incidentType: row.incidentType,
    incidentCount: row.incidentCount,
  }));

  const byTypeTableRows = byType.map((row) => ({
    type: incidentTypeLabel(row.incidentType),
    incidents: row.incidentCount,
    resolved: row.resolvedCount,
    unresolved: row.unresolvedCount,
  }));

  const perHundredChartData = perHundred.map((row) => ({
    className: row.className,
    perHundred: row.perHundred,
  }));

  const perHundredTableRows = perHundred.map((row) => ({
    class: row.className,
    campus: row.campus ?? "—",
    incidents: row.incidents,
    activePupils: row.activePupils,
    perHundred: row.perHundred === null ? "—" : `${row.perHundred}`,
  }));

  return (
    <>
      <PageHeader
        title="Welfare analytics"
        subtitle="How behavioural incidents break down by type, and their rate across the classes."
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
          label="Incidents recorded"
          value={totalIncidents}
          hint="all behavioural incidents"
          primary
        />
        <StatCard
          label="Open"
          value={openIncidents}
          hint="not yet resolved"
          tone={openIncidents > 0 ? "warning" : "deepGreen"}
        />
        <StatCard
          label="Resolved rate"
          value={`${resolvedRate}%`}
          hint="of all incidents resolved"
          tone={resolvedRate >= 50 ? "deepGreen" : resolvedRate > 0 ? "gold" : "neutral"}
        />
        <StatCard
          label="Classes with a rate"
          value={`${classesWithRate} of ${perHundred.length}`}
          hint={classesWithRate === perHundred.length ? "all classes have active pupils" : "with active pupils"}
          tone={classesWithRate > 0 ? "deepGreen" : "neutral"}
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
          category="Incidents"
          title="Incidents by type"
          description="How many incidents fall under each type, for the whole school."
          empty={byTypeChartData.length === 0 || totalIncidents === 0}
          emptyMessage="Record an incident on the incident register to fill this."
          minHeight={320}
        >
          <IncidentsByTypeChart data={byTypeChartData} height={320} />
        </ChartCard>

        <ChartCard
          category="Welfare"
          title="Incidents per hundred pupils by class"
          description="The incident rate per class, per hundred active pupils."
          empty={perHundredChartData.length === 0}
          emptyMessage="No classes yet. Record incidents on the incident register to fill this."
          minHeight={320}
        >
          <IncidentsPerHundredByClassChart data={perHundredChartData} height={320} />
        </ChartCard>
      </Box>

      <Typography variant="h6" sx={{ mt: 4, mb: 0.5 }}>
        Incidents by type
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Each type is shown even when it holds zero incidents, so the picture is honest and complete.
      </Typography>
      <Box sx={{ mb: 4 }}>
        <DataTable
          rows={byTypeTableRows}
          csvName="incidents-by-type"
          columns={[
            { key: "type", label: "Type" },
            { key: "incidents", label: "Incidents", type: "number", align: "right" },
            { key: "resolved", label: "Resolved", type: "number", align: "right" },
            { key: "unresolved", label: "Unresolved", type: "number", align: "right" },
          ]}
          initialSortKey="type"
          initialSortDirection="asc"
          pageSize={10}
        />
      </Box>

      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Incidents per hundred pupils
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        The rate per class, per hundred active pupils. A dash means the class has no active pupils.
      </Typography>
      <Box sx={{ mb: 2 }}>
        {perHundredTableRows.length > 0 ? (
          <DataTable
            rows={perHundredTableRows}
            csvName="incidents-per-hundred-by-class"
            columns={[
              { key: "class", label: "Class" },
              { key: "campus", label: "Campus" },
              { key: "incidents", label: "Incidents", type: "number", align: "right" },
              { key: "activePupils", label: "Active pupils", type: "number", align: "right" },
              { key: "perHundred", label: "Per 100 pupils", align: "right" },
            ]}
            initialSortKey="class"
            initialSortDirection="asc"
            pageSize={10}
          />
        ) : (
          <EmptyState
            title="No classes yet"
            description="Create a class with active pupils and record an incident on the incident register — the rate will appear here."
          />
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        <Button component={Link} href="/admin/incidents" variant="outlined">
          Record an incident
        </Button>
        <Button component={Link} href="/admin/classes" variant="outlined">
          Manage classes
        </Button>
      </Box>
    </>
  );
}
