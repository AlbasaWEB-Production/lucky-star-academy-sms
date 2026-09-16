import { Suspense } from "react";
import Link from "@/components/NextLink";
import { Box, Button, Paper, Skeleton, TableCell, TableRow, Typography } from "@mui/material";

import GenerateAssessmentsForm from "@/components/admin/fees/GenerateAssessmentsForm";
import UrlFilterSelect from "@/components/dashboard/UrlFilterSelect";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { getCurrentTerm, listTerms } from "@/lib/data/dashboard";
import { listFeeAssessmentsForTerm } from "@/lib/data/finance";
import { listClasses } from "@/lib/data/queries";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Fee assessments",
};

export default async function FeeAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string }>;
}) {
  const { term } = await searchParams;

  const [terms, classes, currentTerm] = await Promise.all([
    listTerms(),
    listClasses(),
    getCurrentTerm(),
  ]);

  const termId = term ?? currentTerm?.id ?? terms[0]?.id ?? "";
  const assessments = termId ? await listFeeAssessmentsForTerm(termId) : [];

  const termOptions = terms.map((item) => ({ value: item.id, label: item.name }));
  const classOptions = classes.map((classroom) => ({ value: classroom.id, label: classroom.name }));
  const selectedTerm = terms.find((item) => item.id === termId);

  const totalDue = assessments.reduce((sum, row) => sum + row.amountPesewas, 0);
  const totalPaid = assessments.reduce((sum, row) => sum + row.paidPesewas, 0);
  const totalOwed = assessments.reduce((sum, row) => sum + row.balancePesewas, 0);

  return (
    <>
      <PageHeader
        title="Fee assessments"
        subtitle={`Each pupil's bill for ${selectedTerm?.name ?? "a term"} is the sum of that class's fee structures, less what has been paid.`}
        action={
          <Button component={Link} href="/admin/fees/structures" variant="outlined">
            Manage fee structures
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Generate assessments</Typography>
          <Typography variant="caption" color="text.secondary">
            Creates a bill for every pupil in a class for the term. Pupils already assessed are left
            alone, so re-running it never duplicates a bill.
          </Typography>
        </Box>
        <GenerateAssessmentsForm classes={classOptions} terms={termOptions} />
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Suspense fallback={<Skeleton variant="rounded" height={40} width={180} />}>
          <UrlFilterSelect name="term" label="Term" value={termId} options={termOptions} />
        </Suspense>
      </Box>

      {assessments.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            mb: 3,
          }}
        >
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Billed
            </Typography>
            <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(totalDue)}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Paid
            </Typography>
            <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(totalPaid)}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Still owing
            </Typography>
            <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(totalOwed)}
            </Typography>
          </Paper>
        </Box>
      ) : null}

      <TableShell
        headers={["Pupil", "Roll", "Class", "Amount due", "Paid", "Balance", "Actions"]}
        density="compact"
        columnAlign={["left", "right", "left", "right", "right", "right", "left"]}
        minWidth={760}
        isEmpty={assessments.length === 0}
        emptyMessage={`No assessments for ${selectedTerm?.name ?? "this term"} yet. Add fee structures, then generate assessments to bill a class.`}
      >
        {assessments.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.studentName}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {row.rollNumber}
            </TableCell>
            <TableCell>{row.className}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(row.amountPesewas)}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(row.paidPesewas)}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(row.balancePesewas)}
            </TableCell>
            <TableCell>
              <Button
                component={Link}
                href={`/admin/fees/payments?assessment=${row.id}`}
                size="small"
                variant="outlined"
              >
                Record payment
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
