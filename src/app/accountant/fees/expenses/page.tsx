import { Box, Paper, TableCell, TableRow, Typography } from "@mui/material";

import ExpenseForm from "@/components/admin/fees/ExpenseForm";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { listTerms } from "@/lib/data/dashboard";
import { listExpenses } from "@/lib/data/finance";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Fee expenses",
};

/**
 * What the school has spent, and the form that records it.
 *
 * Same columns and same shared `ExpenseForm` as the admin page, plus a
 * `SearchBar`, because this is a list page and the house conventions give every
 * list page one. The expenses ledger is not term-scoped in the URL, so the
 * search is the only URL state here and cannot disturb anything else.
 *
 * The copy deliberately does not promise a budget-versus-actual comparison:
 * `v_budget_vs_actual` stays admin-only, so an accountant records the spending
 * that an administrator measures. No role check - the accountant layout has
 * already guarded the route.
 */
export default async function AccountantExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const [expenses, terms] = await Promise.all([listExpenses(), listTerms()]);

  const termOptions = terms.map((term) => ({ value: term.id, label: term.name }));

  const totalActual = expenses.reduce((sum, row) => sum + row.amountPesewas, 0);

  const filtered = query
    ? expenses.filter((row) =>
        [row.costCentre, row.description, row.termName].some((field) =>
          field.toLowerCase().includes(query),
        ),
      )
    : expenses;

  const originalSubtitle =
    expenses.length > 0
      ? `${expenses.length} expense${expenses.length === 1 ? "" : "s"} recorded, totalling ${formatCedis(totalActual)}. An administrator measures each cost centre against its budget line.`
      : "No expenses yet. Record the money the school spends so it can be measured against the budget.";

  const subtitle = query
    ? `Showing ${filtered.length} of ${expenses.length} expense${expenses.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  return (
    <>
      <PageHeader title="Fee expenses" subtitle={subtitle} />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Record an expense</Typography>
          <Typography variant="caption" color="text.secondary">
            Log what a cost centre spent in a term. An administrator compares each cost centre
            against the budget line it was given.
          </Typography>
        </Box>
        <ExpenseForm terms={termOptions} />
      </Paper>

      <SearchBar placeholder="Search by cost centre, description or term" initialQuery={q} />

      <TableShell
        headers={["Date", "Term", "Cost centre", "Description", "Amount"]}
        density="compact"
        columnAlign={["left", "left", "left", "left", "right"]}
        isEmpty={filtered.length === 0}
        emptyMessage={
          query && expenses.length > 0
            ? `Nothing matches “${q}”.`
            : "No expenses yet. Record the first one above."
        }
      >
        {filtered.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{new Date(row.expenseDate).toLocaleDateString()}</TableCell>
            <TableCell>{row.termName}</TableCell>
            <TableCell>{row.costCentre}</TableCell>
            <TableCell>{row.description}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(row.amountPesewas)}
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
