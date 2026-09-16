import { Box, Paper, TableCell, TableRow, Typography } from "@mui/material";

import BudgetLineForm from "@/components/admin/fees/BudgetLineForm";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { listTerms } from "@/lib/data/dashboard";
import { listBudgetLines } from "@/lib/data/finance";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Fee budget",
};

export default async function BudgetPage() {
  const [lines, terms] = await Promise.all([listBudgetLines(), listTerms()]);

  const termOptions = terms.map((term) => ({ value: term.id, label: term.name }));

  const totalBudget = lines.reduce((sum, line) => sum + line.budgetPesewas, 0);

  const subtitle =
    lines.length > 0
      ? `${lines.length} budget line${lines.length === 1 ? "" : "s"} across the school, totalling ${formatCedis(totalBudget)}. Spending is recorded on the expenses screen and compared against these lines in the finance overview.`
      : "No budget lines yet. Add how much each cost centre may spend in a term, then record expenses to compare against it.";

  return (
    <>
      <PageHeader title="Fee budget" subtitle={subtitle} />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Add a budget line</Typography>
          <Typography variant="caption" color="text.secondary">
            Set what a cost centre is allowed to spend in a term. The finance overview compares
            this budget against what is actually spent.
          </Typography>
        </Box>
        <BudgetLineForm terms={termOptions} />
      </Paper>

      <TableShell
        headers={["Term", "Cost centre", "Description", "Budget"]}
        density="compact"
        columnAlign={["left", "left", "left", "right"]}
        isEmpty={lines.length === 0}
        emptyMessage="No budget lines yet. Add the first one above."
      >
        {lines.map((line) => (
          <TableRow key={line.id}>
            <TableCell>{line.termName}</TableCell>
            <TableCell>{line.costCentre}</TableCell>
            <TableCell>{line.description ?? "—"}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(line.budgetPesewas)}
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
