import { Box, Paper, TableCell, TableRow, Typography } from "@mui/material";

import ExpenseForm from "@/components/admin/fees/ExpenseForm";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { listTerms } from "@/lib/data/dashboard";
import { listExpenses } from "@/lib/data/finance";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Fee expenses",
};

export default async function ExpensesPage() {
  const [expenses, terms] = await Promise.all([listExpenses(), listTerms()]);

  const termOptions = terms.map((term) => ({ value: term.id, label: term.name }));

  const totalActual = expenses.reduce((sum, row) => sum + row.amountPesewas, 0);

  const subtitle =
    expenses.length > 0
      ? `${expenses.length} expense${expenses.length === 1 ? "" : "s"} recorded, totalling ${formatCedis(totalActual)}. These are compared against budget lines in the finance overview.`
      : "No expenses yet. Record the money the school spends, then compare it against the budget.";

  return (
    <>
      <PageHeader title="Fee expenses" subtitle={subtitle} />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Record an expense</Typography>
          <Typography variant="caption" color="text.secondary">
            Log what a cost centre spent in a term. The finance overview compares each cost centre
            against its budget line.
          </Typography>
        </Box>
        <ExpenseForm terms={termOptions} />
      </Paper>

      <TableShell
        headers={["Date", "Term", "Cost centre", "Description", "Amount"]}
        density="compact"
        columnAlign={["left", "left", "left", "left", "right"]}
        isEmpty={expenses.length === 0}
        emptyMessage="No expenses yet. Record the first one above."
      >
        {expenses.map((row) => (
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
