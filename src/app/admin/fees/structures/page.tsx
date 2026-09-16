import { Box, Paper, TableCell, TableRow, Typography } from "@mui/material";

import FeeStructureForm from "@/components/admin/fees/FeeStructureForm";
import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { deleteFeeStructureAction } from "@/lib/actions/finance";
import { listTerms } from "@/lib/data/dashboard";
import { listFeeStructures } from "@/lib/data/finance";
import { listClasses } from "@/lib/data/queries";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Fee structures",
};

export default async function FeeStructuresPage() {
  const [structures, classes, terms] = await Promise.all([
    listFeeStructures(),
    listClasses(),
    listTerms(),
  ]);

  const classOptions = classes.map((classroom) => ({ value: classroom.id, label: classroom.name }));
  const termOptions = terms.map((term) => ({ value: term.id, label: term.name }));

  const subtitle =
    structures.length > 0
      ? `${structures.length} fee structure${structures.length === 1 ? "" : "s"} set for the school.`
      : "No fee structures yet. Add one, then generate assessments to bill every pupil in a class.";

  return (
    <>
      <PageHeader title="Fee structures" subtitle={subtitle} />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Add a fee structure</Typography>
          <Typography variant="caption" color="text.secondary">
            Set what a class owes for a term. When the structure is repeated for a second class, add it again — each structure is scoped to one class and one term.
          </Typography>
        </Box>
        <FeeStructureForm classes={classOptions} terms={termOptions} />
      </Paper>

      <TableShell
        headers={["Class", "Term", "Description", "Amount", "Due date", "Actions"]}
        density="compact"
        columnAlign={["left", "left", "left", "right", "left", "left"]}
        isEmpty={structures.length === 0}
        emptyMessage="No fee structures yet. Add the first one above, then generate assessments to bill a class."
      >
        {structures.map((structure) => (
          <TableRow key={structure.id}>
            <TableCell>{structure.className}</TableCell>
            <TableCell>{structure.termName}</TableCell>
            <TableCell>{structure.description}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(structure.amountPesewas)}
            </TableCell>
            <TableCell>
              {structure.dueDate ? new Date(structure.dueDate).toLocaleDateString() : "—"}
            </TableCell>
            <TableCell>
              <ConfirmActionButton
                action={deleteFeeStructureAction}
                fields={{ feeStructureId: structure.id }}
                label="Delete"
                confirmTitle="Delete this fee structure?"
                confirmMessage={`${structure.className} • ${structure.termName}: the "${structure.description}" structure for ${formatCedis(structure.amountPesewas)} will be removed. Pupils who already have an assessment for the term are unaffected. This cannot be undone.`}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
