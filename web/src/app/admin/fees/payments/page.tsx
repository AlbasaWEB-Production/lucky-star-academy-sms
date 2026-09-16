import { Suspense } from "react";
import Link from "@/components/NextLink";
import { Box, Button, Paper, Skeleton, TableCell, TableRow, Typography } from "@mui/material";

import RecordPaymentSelectForm from "@/components/admin/fees/RecordPaymentSelectForm";
import UrlFilterSelect from "@/components/dashboard/UrlFilterSelect";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { getCurrentTerm, listTerms } from "@/lib/data/dashboard";
import { listFeeAssessmentsForTerm, listPaymentsForTerm } from "@/lib/data/finance";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Fees payments",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile money",
  bank: "Bank",
};

export default async function FeePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string; assessment?: string }>;
}) {
  const { term, assessment } = await searchParams;

  const [terms, currentTerm] = await Promise.all([listTerms(), getCurrentTerm()]);
  const termId = term ?? currentTerm?.id ?? terms[0]?.id ?? "";

  const [assessments, payments] = termId
    ? await Promise.all([
        listFeeAssessmentsForTerm(termId),
        listPaymentsForTerm(termId),
      ])
    : [[], []];

  const termOptions = terms.map((item) => ({ value: item.id, label: item.name }));
  const selectedTerm = terms.find((item) => item.id === termId);

  const assessmentOptions = assessments.map((row) => ({
    value: row.id,
    label: `${row.studentName} — ${row.className} (${formatCedis(row.balancePesewas)} owing)`,
  }));

  return (
    <>
      <PageHeader title="Fees payments" subtitle="The payment ledger, and where a bursar records money received." />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Record a payment</Typography>
          <Typography variant="caption" color="text.secondary">
            Pick the pupil, enter the amount and method. The receipt number is generated automatically
            and the receipt opens once it is saved.
          </Typography>
        </Box>
        <RecordPaymentSelectForm assessments={assessmentOptions} initialAssessment={assessment ?? ""} />
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Suspense fallback={<Skeleton variant="rounded" height={40} width={180} />}>
          <UrlFilterSelect name="term" label="Term" value={termId} options={termOptions} />
        </Suspense>
      </Box>

      <TableShell
        headers={["Receipt", "Pupil", "Class", "Amount", "Method", "Date", "Type", "Actions"]}
        density="compact"
        columnAlign={["right", "left", "left", "right", "left", "left", "left", "left"]}
        minWidth={820}
        isEmpty={payments.length === 0}
        emptyMessage={`No payments for ${selectedTerm?.name ?? "this term"} yet. Record the first one above.`}
      >
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {payment.receiptNumber}
            </TableCell>
            <TableCell>{payment.studentName}</TableCell>
            <TableCell>{payment.className}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(payment.amountPesewas)}
            </TableCell>
            <TableCell>{METHOD_LABELS[payment.method] ?? payment.method}</TableCell>
            <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
            <TableCell>{payment.isReversal ? "Reversal" : "Payment"}</TableCell>
            <TableCell>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  component={Link}
                  href={`/admin/fees/receipts/${payment.id}`}
                  size="small"
                  variant="outlined"
                >
                  Receipt
                </Button>
                {!payment.isReversal ? (
                  <Button
                    component={Link}
                    href={`/admin/fees/payments/${payment.id}/reverse`}
                    size="small"
                    variant="text"
                    color="error"
                  >
                    Reverse
                  </Button>
                ) : null}
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
