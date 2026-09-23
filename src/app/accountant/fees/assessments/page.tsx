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

/**
 * The term's fee assessments, and the form that issues them.
 *
 * The same shape as the admin page: choose a class and a term to bill, then
 * read every bill below, filtered to one term. `GenerateAssessmentsForm` and
 * `generateAssessmentsAction` are shared, not forked - issuing the term's bills
 * is book-keeping, so the accountant may do it, while the fee structures the
 * bill is summed from stay an administrator's to set. That is why the header
 * action points at the fee overview rather than at the admin's "manage fee
 * structures" screen, which does not exist in this portal.
 *
 * No role check: the accountant layout has already guarded the route.
 */
export default async function AccountantFeeAssessmentsPage({
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
  const termName = selectedTerm?.name ?? "this term";

  const totalDue = assessments.reduce((sum, row) => sum + row.amountPesewas, 0);
  const totalPaid = assessments.reduce((sum, row) => sum + row.paidPesewas, 0);
  const totalOwed = assessments.reduce((sum, row) => sum + row.balancePesewas, 0);

  return (
    <>
      <PageHeader
        title="Fee assessments"
        subtitle={`Each pupil's bill for ${termName} is the sum of that class's fee structures, less what has been paid.`}
        action={
          <Button component={Link} href="/accountant/fees" variant="outlined">
            Fee overview
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Generate assessments</Typography>
          <Typography variant="caption" color="text.secondary">
            Creates a bill for every pupil in a class for the term. Pupils already assessed are left
            alone, so re-running it never duplicates a bill. The amount comes from the class&apos;s
            fee structures, which an administrator sets — ask one if a class has none yet.
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
        emptyMessage={
          terms.length === 0
            ? "No terms have been set up for this school yet. An administrator creates the school's terms before a class can be billed."
            : `No pupil has been billed for ${termName} yet. Once an administrator has set the class's fee structures, generate its assessments above.`
        }
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
                href={`/accountant/fees/payments?assessment=${row.id}`}
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
