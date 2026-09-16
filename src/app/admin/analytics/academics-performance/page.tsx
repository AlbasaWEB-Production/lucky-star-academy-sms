import { Box } from "@mui/material";

import ChartCard from "@/components/dashboard/ChartCard";
import DataTable from "@/components/dashboard/DataTable";
import ClassAverageTrendChart from "@/components/charts/ClassAverageTrendChart";
import PassPromotionRatesChart from "@/components/charts/PassPromotionRatesChart";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import {
  getPassMark,
  listClassAverageTrend,
  listPassPromotionRates,
} from "@/lib/data/academics";
import { getCurrentTerm, listTerms } from "@/lib/data/dashboard";

export const metadata = {
  title: "Performance analytics",
};

/**
 * Pass and promotion rates against the configured pass mark, plus the class
 * average trend.
 *
 * All reads go through the security_invoker views in
 * `20260101000500_deepen_academics.sql`, so RLS scopes the rows. The pass mark
 * is a school-level `dashboard_thresholds` key (default 50), read live here and
 * used inside the views, so the number a chart draws and the number in the KPI
 * card can never disagree.
 */
export default async function AcademicsPerformancePage() {
  const [rates, classAverage, passMark, currentTerm, terms] = await Promise.all([
    listPassPromotionRates(),
    listClassAverageTrend(),
    getPassMark(),
    getCurrentTerm(),
    listTerms(),
  ]);

  // The view emits term_name but not term_number, so order terms from the term
  // calendar rather than alphabetically (where "Term 10" would sort before "Term 2").
  const termNumberById = new Map(terms.map((term) => [term.id, term.termNumber]));

  // The view is per (class, term). For the per-term KPI chart, roll each term up
  // across classes so a term gets one pass rate and one promotion rate.
  const byTerm = new Map<string, { passed: number; total: number; promoted: number; assessed: number }>();
  for (const row of rates) {
    const agg = byTerm.get(row.termId) ?? { passed: 0, total: 0, promoted: 0, assessed: 0 };
    agg.passed += row.passedMarks;
    agg.total += row.totalMarks;
    agg.promoted += row.promotedPupils;
    agg.assessed += row.assessedPupils;
    byTerm.set(row.termId, {
      passed: agg.passed,
      total: agg.total,
      promoted: agg.promoted,
      assessed: agg.assessed,
    });
  }

  const termPassPromotion = rates
    .reduce<{ termId: string; termName: string; termNumber: number }[]>(
      (acc, row) => {
        if (!acc.some((entry) => entry.termId === row.termId)) {
          acc.push({
            termId: row.termId,
            termName: row.termName,
            termNumber: termNumberById.get(row.termId) ?? 0,
          });
        }
        return acc;
      },
      [],
    )
    .sort((a, b) => a.termNumber - b.termNumber)
    .map((term) => {
      const agg = byTerm.get(term.termId)!;
      return {
        termName: term.termName,
        passRatePercent:
          agg.total > 0 ? Math.round((agg.passed / agg.total) * 1000) / 10 : null,
        promotionRatePercent:
          agg.assessed > 0 ? Math.round((agg.promoted / agg.assessed) * 1000) / 10 : null,
      };
    });

  // Class-average trend chart: one line per class, one point per term.
  const classTrendData = classAverage.map((row) => ({
    termName: row.termName,
    className: row.className,
    avgMark: row.avgMark,
  }));

  // Overall average mark, weighted by how many marks each class average was
  // taken over — the same weighting the head dashboard uses for its snapshot.
  const weightedTotal = classAverage.reduce(
    (acc, row) => ({
      total: acc.total + (row.avgMark ?? 0) * row.marksCount,
      count: acc.count + row.marksCount,
    }),
    { total: 0, count: 0 },
  );
  const overallAverageMark =
    weightedTotal.count > 0 ? Math.round((weightedTotal.total / weightedTotal.count) * 10) / 10 : null;

  const mostRecentTerm = termPassPromotion[termPassPromotion.length - 1] ?? null;

  const passTableRows = rates.map((row) => ({
    class: row.className,
    term: row.termName,
    passRate: row.passRatePercent,
    promotionRate: row.promotionRatePercent,
    assessed: row.assessedPupils,
  }));

  return (
    <>
      <PageHeader
        title="Performance analytics"
        subtitle="Pass and promotion rates against the school's pass mark, and how each class's average moves across terms."
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
          label="Average mark"
          value={overallAverageMark ?? "—"}
          hint="across every term-scored mark"
          primary
        />
        <StatCard
          label="Pass rate"
          value={mostRecentTerm?.passRatePercent ?? "—"}
          hint={mostRecentTerm ? `${mostRecentTerm.termName} · marks at or above the mark` : "no term-scored marks yet"}
        />
        <StatCard
          label="Promotion rate"
          value={mostRecentTerm?.promotionRatePercent ?? "—"}
          hint={mostRecentTerm ? `${mostRecentTerm.termName} · pupils who met the mark on average` : "no term-scored pupils yet"}
          tone={mostRecentTerm?.promotionRatePercent != null && mostRecentTerm.promotionRatePercent < passMark ? "warning" : "deepGreen"}
        />
        <StatCard
          label="Pass mark"
          value={passMark}
          hint="configurable in school settings"
          tone="gold"
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
          category="Performance"
          title="Average mark per class, across terms"
          description="One line per class; a gap in a line is a term with no marks for that class."
          empty={classTrendData.length === 0}
          emptyMessage="No term-scoped marks yet. Record exam marks on the marking screen to fill this."
          minHeight={320}
        >
          <ClassAverageTrendChart data={classTrendData} height={320} />
        </ChartCard>

        <ChartCard
          category="Performance"
          title="Pass and promotion rates per term"
          description={`Bars against the dashed line at pass mark ${passMark}.`}
          empty={termPassPromotion.length === 0}
          emptyMessage="No term-scoped marks yet. Record exam marks on the marking screen to fill this."
          minHeight={320}
        >
          <PassPromotionRatesChart data={termPassPromotion} passMark={passMark} height={320} />
        </ChartCard>
      </Box>

      <Box sx={{ mb: 4 }}>
        <DataTable
          rows={passTableRows}
          csvName="pass-promotion-rates"
          columns={[
            { key: "class", label: "Class" },
            { key: "term", label: "Term" },
            { key: "assessed", label: "Assessed pupils", type: "number", align: "right" },
            { key: "passRate", label: "Pass rate", type: "percent", align: "right" },
            { key: "promotionRate", label: "Promotion rate", type: "percent", align: "right" },
          ]}
          initialSortKey="term"
          initialSortDirection="asc"
          pageSize={10}
        />
      </Box>

      {currentTerm ? null : (
        <Box sx={{ mb: 2 }}>
          <EmptyState
            title="No terms set up yet"
            description="The pass and promotion figures need a term calendar so a mark can be scoped to a term. Create a term first, then record marks."
          />
        </Box>
      )}
    </>
  );
}
