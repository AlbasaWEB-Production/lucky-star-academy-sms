import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaymentsIcon from "@mui/icons-material/Payments";
import PercentIcon from "@mui/icons-material/Percent";
import ScheduleIcon from "@mui/icons-material/Schedule";

import BudgetVsActualChart from "@/components/charts/BudgetVsActualChart";
import CashPositionChart from "@/components/charts/CashPositionChart";
import FeesCollectedVsExpectedChart from "@/components/charts/FeesCollectedVsExpectedChart";
import OutstandingByClassChart from "@/components/charts/OutstandingByClassChart";
import ChartCard from "@/components/dashboard/ChartCard";
import DataTable from "@/components/dashboard/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { getCurrentTerm } from "@/lib/data/dashboard";
import {
  listBudgetVsActual,
  listCashPosition,
  listFeesCollectedVsExpected,
  listFeeStatusByStudent,
  listOutstandingByClass,
} from "@/lib/data/finance";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Fees and finance",
};

export default async function FeesOverviewPage() {
  const [
    currentTerm,
    collectedVsExpected,
    outstandingByClass,
    cashPosition,
    budgetVsActual,
  ] = await Promise.all([
    getCurrentTerm(),
    listFeesCollectedVsExpected(),
    listOutstandingByClass(),
    listCashPosition(),
    listBudgetVsActual(),
  ]);

  const currentTermId = currentTerm?.id ?? "";

  // The term rows already come ordered by start date, so the previous term is
  // the one right before the current term in that order.
  const ordered = [...collectedVsExpected].sort((a, b) =>
    (a.startDate ?? "").localeCompare(b.startDate ?? ""),
  );
  const currentIndex = ordered.findIndex((row) => row.termId === currentTermId);
  const current = currentIndex >= 0 ? ordered[currentIndex] : undefined;
  const prev = currentIndex > 0 ? ordered[currentIndex - 1] : undefined;

  const collectedTotal = current?.collectedPesewas ?? 0;
  const expectedTotal = current?.expectedPesewas ?? 0;
  const curRate = current?.collectionRate ?? null;
  const curDays = current?.avgDaysToPay ?? null;

  // Outstanding across the current term's classes (after reversals).
  const termOutstanding = outstandingByClass
    .filter((row) => row.termId === currentTermId)
    .reduce((sum, row) => sum + row.outstandingPesewas, 0);

  const rateTrend = buildRateTrend(curRate, prev?.collectionRate ?? null);
  const daysTrend = buildDaysTrend(curDays, prev?.avgDaysToPay ?? null);

  const collectedChartData = ordered.map((row) => ({
    name: row.termName,
    expected: row.expectedPesewas,
    collected: row.collectedPesewas,
  }));

  const outstandingChartData = outstandingByClass
    .filter((row) => row.termId === currentTermId)
    .map((row) => ({
      name: row.className,
      collected: row.collectedPesewas,
      outstanding: row.outstandingPesewas,
    }));

  const cashChartData = cashPosition.map((row) => ({
    name: row.month,
    income: row.incomePesewas,
    expenses: row.expensesPesewas,
    runningBalance: row.runningBalancePesewas,
  }));

  const budgetChartData = budgetVsActual
    .filter((row) => row.termId === currentTermId)
    .map((row) => ({
      name: row.costCentre,
      budget: row.budgetPesewas,
      actual: row.actualPesewas,
    }));

  // Defaulters: pupils with a balance outstanding this term, from the
  // fee-status view. Admin only; a pupil never reaches this screen.
  const fullStatus = currentTermId ? await listFeeStatusByStudent(currentTermId) : [];
  const defaulters = fullStatus.filter((row) => row.balancePesewas > 0);
  const defaulterRows = defaulters.map((row) => ({
    pupil: row.studentName,
    class: row.className,
    campus: row.campus ?? "—",
    due: row.amountDuePesewas,
    paid: row.paidPesewas,
    balance: row.balancePesewas,
  }));

  const owedMoney = termOutstanding;

  return (
    <>
      <PageHeader
        title="Fees and finance"
        subtitle="What the school expects to collect, what it has received, and what is still owed — money is stored and shown as pesewas, never invented."
        action={
          <Button component={Link} href="/admin/fees/budget" variant="outlined">
            Budget
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
          label="Collection rate"
          value={curRate === null ? "—" : `${curRate.toFixed(1)}%`}
          hint="of the expected fees from the current term"
          icon={<PercentIcon />}
          tone="primary"
          primary
          trend={rateTrend}
        />
        <StatCard
          label="Days to pay"
          value={curDays === null ? "—" : `${curDays.toFixed(1)} days`}
          hint="average time from bill to payment"
          icon={<ScheduleIcon />}
          tone="gold"
          trend={daysTrend}
        />
        <StatCard
          label="Still owing"
          value={formatCedis(owedMoney)}
          hint="current term, after anything reversed"
          icon={<AccountBalanceWalletIcon />}
          tone="warning"
        />
        <StatCard
          label="Collected"
          value={formatCedis(collectedTotal)}
          hint={expectedTotal > 0 ? `of ${formatCedis(expectedTotal)} expected` : "no fees expected yet"}
          icon={<PaymentsIcon />}
          tone="deepGreen"
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
          category="Fees"
          title="Collected versus expected"
          description="Each term's expected fees (gold target line) against what was actually collected (green bars). A bar that falls short of the line is money still owed."
          empty={collectedChartData.length === 0}
          emptyMessage="No assessments have been generated yet, so there is nothing to compare."
        >
          <FeesCollectedVsExpectedChart data={collectedChartData} />
        </ChartCard>

        <ChartCard
          category="Fees"
          title="Outstanding by class"
          description="Each class's expected fees split into collected and still-owing, so the class with the most money outstanding is the tallest gold segment."
          empty={outstandingChartData.length === 0}
          emptyMessage="No assessments exist for the current term yet."
        >
          <OutstandingByClassChart data={outstandingChartData} height={Math.max(260, outstandingChartData.length * 48)} />
        </ChartCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "1fr 1fr" },
          alignItems: "start",
          mb: 4,
        }}
      >
        <ChartCard
          category="Cash"
          title="Monthly cash position"
          description="Income and expenses per month, with the running cash balance overlaid, so a bursar sees the school's bank position over time."
          empty={cashChartData.length === 0}
          emptyMessage="No payments or expenses have been recorded yet."
        >
          <CashPositionChart data={cashChartData} />
        </ChartCard>

        <ChartCard
          category="Cash"
          title="Budget versus actual"
          description="What each cost centre was allowed to spend against what it actually spent, for the current term. A gold bar that overhangs its sage budget bar is overspending."
          empty={budgetChartData.length === 0}
          emptyMessage="No budget lines or expenses for the current term yet."
        >
          <BudgetVsActualChart data={budgetChartData} />
        </ChartCard>
      </Box>

      <Box id="defaulters" sx={{ mb: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="h6">Pupils still owing</Typography>
            <Typography variant="caption" color="text.secondary">
              Every pupil with a balance on the current term, sorted by how much is owed. This list is
              for staff only — a pupil never sees it.
            </Typography>
          </Box>
          <Button component={Link} href="/admin/fees/payments" size="small">
            Record payment
          </Button>
        </Box>

        {defaulterRows.length === 0 ? (
          <Paper variant="outlined">
            <EmptyState
              title="No one is owing"
              description={
                currentTermId
                  ? "Every pupil assessed for the current term has paid in full — no balance remains."
                  : "No assessments exist for the current term yet, so there is no debt to show."
              }
            />
          </Paper>
        ) : (
          <DataTable
            rows={defaulterRows}
            csvName="defaulters"
            columns={[
              { key: "pupil", label: "Pupil" },
              { key: "class", label: "Class" },
              { key: "campus", label: "Campus" },
              { key: "due", label: "Amount due", type: "money", align: "right" },
              { key: "paid", label: "Paid", type: "money", align: "right" },
              { key: "balance", label: "Still owing", type: "money", align: "right" },
            ]}
            initialSortKey="balance"
            initialSortDirection="desc"
            pageSize={20}
          />
        )}
      </Box>
    </>
  );
}

/**
 * Percentage-point change in collection rate against the previous term. A rise
 * in the rate is good news (direction up, positive true); a fall moves down and
 * is bad.
 */
function buildRateTrend(
  current: number | null,
  previous: number | null,
): { value: string; direction: "up" | "down" | "flat"; positive?: boolean; label: string } | undefined {
  if (current === null || previous === null) {
    return undefined;
  }
  const delta = current - previous;
  return deltaTrend(delta, "pts", true);
}

/**
 * Change in average days-to-pay against the previous term. A faster collection
 * (fewer days) is the good direction, so a falling number is positive.
 */
function buildDaysTrend(
  current: number | null,
  previous: number | null,
): { value: string; direction: "up" | "down" | "flat"; positive?: boolean; label: string } | undefined {
  if (current === null || previous === null) {
    return undefined;
  }
  const delta = current - previous;
  // Fewer days is better, so "down" is the good direction here.
  return deltaTrend(delta, "days", false);
}

function deltaTrend(
  delta: number,
  unit: string,
  higherIsBetter: boolean,
): { value: string; direction: "up" | "down" | "flat"; positive?: boolean; label: string } {
  const rounded = Number(delta.toFixed(1));
  const direction = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const sign = rounded > 0 ? "+" : "";
  const positive = higherIsBetter ? rounded > 0 : rounded < 0;
  return {
    value: `${sign}${rounded} ${unit}`,
    direction,
    positive: rounded === 0 ? undefined : positive,
    label: "vs last term",
  };
}
