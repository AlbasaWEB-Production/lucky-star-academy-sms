import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaymentsIcon from "@mui/icons-material/Payments";
import PercentIcon from "@mui/icons-material/Percent";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

import CashPositionChart from "@/components/charts/CashPositionChart";
import FeesCollectedVsExpectedChart from "@/components/charts/FeesCollectedVsExpectedChart";
import OutstandingByClassChart from "@/components/charts/OutstandingByClassChart";
import ChartCard from "@/components/dashboard/ChartCard";
import DataTable from "@/components/dashboard/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard, { type StatCardTrend } from "@/components/ui/StatCard";
import { getCurrentTerm, listTerms } from "@/lib/data/dashboard";
import {
  listCashPosition,
  listFeesCollectedVsExpected,
  listFeeStatusByStudent,
  listOutstandingByClass,
} from "@/lib/data/finance";
import { listNotices } from "@/lib/data/queries";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Accountant dashboard",
};

/**
 * The finance desk's home screen.
 *
 * The question it answers is "what needs settling today, and is the money
 * moving?" - the hero is collected-versus-expected beside a to-do list, then
 * the supporting money charts, then the recent notices. The hierarchy is the
 * admin dashboard's, with the finance reads swapped in.
 *
 * There is deliberately no budget-versus-actual panel here: setting a budget is
 * an admin decision, and `v_budget_vs_actual` is not redeclared for the
 * accountant in `20260101000950_staff_portals.sql`, so it would come back empty
 * and read as "spent nothing" rather than "not shown to you".
 *
 * No role check: `src/app/accountant/layout.tsx` has already run
 * `loadShellContext("accountant")`, and RLS scopes every row below.
 */
export default async function AccountantDashboardPage() {
  // Independent reads, so they run concurrently rather than in sequence.
  const [currentTerm, terms, collectedVsExpected, outstandingByClass, cashPosition, notices] =
    await Promise.all([
      getCurrentTerm(),
      listTerms(),
      listFeesCollectedVsExpected(),
      listOutstandingByClass(),
      listCashPosition(),
      listNotices(),
    ]);

  const currentTermId = currentTerm?.id ?? "";

  // The per-pupil status depends on which term is in session, so it comes after
  // the batch above rather than inside it.
  const feeStatus = currentTermId ? await listFeeStatusByStudent(currentTermId) : [];

  // The term rows already come ordered by start date, so the previous term is
  // the one right before the current term in that order. Same derivation as the
  // admin fee overview, so the two screens can never disagree about "last term".
  const ordered = [...collectedVsExpected].sort((a, b) =>
    (a.startDate ?? "").localeCompare(b.startDate ?? ""),
  );
  const currentIndex = ordered.findIndex((row) => row.termId === currentTermId);
  const current = currentIndex >= 0 ? ordered[currentIndex] : undefined;
  const previous = currentIndex > 0 ? ordered[currentIndex - 1] : undefined;

  const collectedPesewas = current?.collectedPesewas ?? 0;
  const expectedPesewas = current?.expectedPesewas ?? 0;
  const collectionRate = current?.collectionRate ?? null;
  const rateTrend = buildRateTrend(collectionRate, previous?.collectionRate ?? null);

  const termClasses = outstandingByClass.filter((row) => row.termId === currentTermId);
  const outstandingPesewas = termClasses.reduce((sum, row) => sum + row.outstandingPesewas, 0);

  const defaulters = feeStatus.filter((row) => row.balancePesewas > 0);
  const nothingPaidYet = defaulters.filter((row) => row.paidPesewas === 0);
  const classesWithNothingCollected = termClasses.filter(
    (row) => row.expectedPesewas > 0 && row.collectedPesewas === 0,
  );
  const monthsInTheRed = cashPosition.filter((row) => row.netPesewas < 0);

  const collectedChartData = ordered.map((row) => ({
    name: row.termName,
    expected: row.expectedPesewas,
    collected: row.collectedPesewas,
  }));

  const outstandingChartData = termClasses.map((row) => ({
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

  const defaulterRows = defaulters.map((row) => ({
    pupil: row.studentName,
    class: row.className,
    campus: row.campus ?? "—",
    due: row.amountDuePesewas,
    paid: row.paidPesewas,
    balance: row.balancePesewas,
  }));

  const recentNotices = notices.slice(0, 5);

  // Three-way empty message: no terms at all, terms but no bills, or bills that
  // are all settled. Each one names the next action rather than saying "no data".
  const defaultersEmptyMessage =
    terms.length === 0
      ? "No terms have been set up for this school yet. A term has to exist before a class can be billed."
      : feeStatus.length === 0
        ? `No pupil has been billed for ${currentTerm?.name ?? "the current term"} yet. Issue the term's assessments, then the debtors appear here.`
        : `Every pupil billed for ${currentTerm?.name ?? "the current term"} has paid in full.`;

  const attentionItems = [
    {
      key: "defaulters",
      count: defaulters.length,
      label: defaulters.length === 1 ? "pupil still owes fees" : "pupils still owe fees",
      href: "/accountant/fees",
      icon: <AccountBalanceWalletIcon fontSize="small" />,
    },
    {
      key: "uncollected",
      count: classesWithNothingCollected.length,
      label:
        classesWithNothingCollected.length === 1
          ? "class has collected nothing yet"
          : "classes have collected nothing yet",
      href: "/accountant/fees/payments",
      icon: <PaymentsIcon fontSize="small" />,
    },
    {
      key: "deficit",
      count: monthsInTheRed.length,
      label: monthsInTheRed.length === 1 ? "month spent more than it took" : "months spent more than they took",
      href: "/accountant/fees/expenses",
      icon: <TrendingDownIcon fontSize="small" />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={
          currentTerm
            ? `What the finance desk still has to settle in ${currentTerm.name}, and how the school's money is moving.`
            : "What the finance desk still has to settle, and how the school's money is moving."
        }
        action={
          <Button component={Link} href="/accountant/fees/payments" variant="contained">
            Record payment
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
          label="Still owing"
          value={formatCedis(outstandingPesewas)}
          hint={`${currentTerm?.name ?? "current term"}, after anything reversed`}
          icon={<AccountBalanceWalletIcon />}
          tone="warning"
          primary
        />
        <StatCard
          label="Pupils still owing"
          value={defaulters.length}
          hint={
            feeStatus.length === 0
              ? "nobody has been billed for this term yet"
              : nothingPaidYet.length > 0
                ? `${nothingPaidYet.length} of them have paid nothing yet`
                : `of ${feeStatus.length} pupils billed`
          }
          icon={<ReportProblemIcon />}
          tone={defaulters.length > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Collected this term"
          value={formatCedis(collectedPesewas)}
          hint={expectedPesewas > 0 ? `of ${formatCedis(expectedPesewas)} billed` : "nothing billed yet"}
          icon={<PaymentsIcon />}
          tone="deepGreen"
        />
        <StatCard
          label="Collection rate"
          value={collectionRate === null ? "—" : `${collectionRate.toFixed(1)}%`}
          hint="of the fees billed this term"
          icon={<PercentIcon />}
          tone="primary"
          trend={rateTrend}
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
          category="Fees"
          title="Collected versus expected"
          description="Each term's billed fees (gold target line) against what was actually banked (green bars). A bar short of the line is money still owed."
          empty={collectedChartData.length === 0}
          emptyMessage="No term has any assessment yet, so there is nothing to compare. Issue a term's assessments first."
        >
          <FeesCollectedVsExpectedChart data={collectedChartData} />
        </ChartCard>

        <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
          <Typography variant="overline" color="text.secondary">
            Needs attention
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            What to chase today
          </Typography>

          {attentionItems.every((item) => item.count === 0) ? (
            <EmptyState
              title="Nothing outstanding"
              description="Every pupil billed for the current term has paid in full, every class has collected something, and no month has spent more than it took. Nothing to chase."
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
                    {item.icon}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" sx={{ lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
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
          category="Fees"
          title="Outstanding by class"
          description="Each class's billed fees split into collected and still owing for the term in session, so the tallest gold segment is where the money is."
          empty={outstandingChartData.length === 0}
          emptyMessage="No class has been billed for the current term yet, so there is nothing outstanding to show."
        >
          <OutstandingByClassChart
            data={outstandingChartData}
            height={Math.max(260, outstandingChartData.length * 48)}
          />
        </ChartCard>

        <ChartCard
          category="Cash"
          title="Monthly cash position"
          description="Income and expenses per month with the running cash balance overlaid — the bank position over time."
          empty={cashChartData.length === 0}
          emptyMessage="No payments or expenses have been recorded yet, so there is no cash movement to chart."
        >
          <CashPositionChart data={cashChartData} />
        </ChartCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" },
          alignItems: "start",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h6">Pupils still owing</Typography>
              <Typography variant="caption" color="text.secondary">
                Every pupil with a balance on {currentTerm?.name ?? "the current term"}, largest debt
                first. Staff only — a pupil never sees another pupil&apos;s balance.
              </Typography>
            </Box>
            <Button component={Link} href="/accountant/fees" size="small">
              Full list
            </Button>
          </Box>

          <DataTable
            rows={defaulterRows}
            csvName="fee-defaulters"
            columns={[
              { key: "pupil", label: "Pupil" },
              { key: "class", label: "Class" },
              { key: "campus", label: "Campus" },
              { key: "due", label: "Amount due", type: "money", align: "right" },
              { key: "paid", label: "Paid", type: "money", align: "right" },
              { key: "balance", label: "Still owing", type: "money", align: "right" },
            ]}
            emptyMessage={defaultersEmptyMessage}
            noMatchMessage="No pupil on this list matches your filter."
            filterPlaceholder="Filter by pupil or class…"
            initialSortKey="balance"
            initialSortDirection="desc"
            pageSize={10}
          />
        </Box>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Recent notices</Typography>
            <Button component={Link} href="/accountant/notices" size="small">
              View all
            </Button>
          </Box>

          {recentNotices.length === 0 ? (
            <EmptyState
              title="No notices yet"
              description="Notices published by your school appear here and on every portal."
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

/**
 * Percentage-point change in collection rate against the previous term. A rise
 * in the rate is good news (direction up, positive true); a fall moves down and
 * is bad. `undefined` when either term has no rate to compare, which leaves the
 * card without a trend line rather than inventing one.
 */
function buildRateTrend(current: number | null, previous: number | null): StatCardTrend | undefined {
  if (current === null || previous === null) {
    return undefined;
  }

  const delta = Number((current - previous).toFixed(1));
  const sign = delta > 0 ? "+" : "";
  return {
    value: `${sign}${delta} pts`,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    positive: delta === 0 ? undefined : delta > 0,
    label: "vs last term",
  };
}
