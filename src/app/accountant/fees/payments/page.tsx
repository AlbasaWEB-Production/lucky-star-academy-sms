import { Suspense } from "react";
import { Box, Paper, Skeleton, TableCell, TableRow, Typography } from "@mui/material";

import RecordPaymentSelectForm from "@/components/admin/fees/RecordPaymentSelectForm";
import UrlFilterSelect from "@/components/dashboard/UrlFilterSelect";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { getCurrentTerm, listTerms } from "@/lib/data/dashboard";
import { listFeeAssessmentsForTerm, listPaymentsForTerm } from "@/lib/data/finance";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Fee payments",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile money",
  bank: "Bank",
};

/**
 * The payment ledger, and the form that banks a payment.
 *
 * `RecordPaymentSelectForm` and `recordPaymentAction` are shared with the admin
 * page, not forked: banking money is book-keeping. Reversing it is not, and
 * `reversePaymentAction` stays admin-only - so this ledger has no "Reverse"
 * button and no Actions column at all. There is also no accountant receipt
 * route (`/admin/fees/receipts/[id]` is inside the admin subtree, which
 * `src/proxy.ts` keeps the accountant out of), so the receipt number is read
 * from the first column here, and
 * `recordPaymentAction` lands the accountant back on this ledger after a save
 * rather than on a receipt they would be bounced away from.
 *
 * The term filter stays the only URL state on this page: the shared `SearchBar`
 * rewrites the whole query string, so adding one beside `?term=` would silently
 * reset the term the moment somebody typed in it. No role check - the
 * accountant layout has already guarded the route.
 */
export default async function AccountantFeePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string; assessment?: string }>;
}) {
  const { term, assessment } = await searchParams;

  const [terms, currentTerm] = await Promise.all([listTerms(), getCurrentTerm()]);
  const termId = term ?? currentTerm?.id ?? terms[0]?.id ?? "";

  const [assessments, payments] = termId
    ? await Promise.all([listFeeAssessmentsForTerm(termId), listPaymentsForTerm(termId)])
    : [[], []];

  const termOptions = terms.map((item) => ({ value: item.id, label: item.name }));
  const selectedTerm = terms.find((item) => item.id === termId);
  const termName = selectedTerm?.name ?? "this term";

  const assessmentOptions = assessments.map((row) => ({
    value: row.id,
    label: `${row.studentName} — ${row.className} (${formatCedis(row.balancePesewas)} owing)`,
  }));

  const received = payments.reduce(
    (total, row) => total + (row.isReversal ? -row.amountPesewas : row.amountPesewas),
    0,
  );

  const subtitle =
    payments.length > 0
      ? `${payments.length} ${payments.length === 1 ? "entry" : "entries"} for ${termName}, newest first, netting ${formatCedis(received)}.`
      : `Money received against ${termName}'s assessments. Record the first payment below.`;

  return (
    <>
      <PageHeader title="Fee payments" subtitle={subtitle} />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Record a payment</Typography>
          <Typography variant="caption" color="text.secondary">
            Pick the pupil, enter the amount and method. The receipt number is generated
            automatically, and the payment appears at the top of the ledger below. Only an
            administrator can reverse a payment once it is banked.
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
        headers={["Receipt", "Pupil", "Class", "Amount", "Method", "Date", "Type"]}
        density="compact"
        columnAlign={["right", "left", "left", "right", "left", "left", "left"]}
        minWidth={760}
        isEmpty={payments.length === 0}
        emptyMessage={
          terms.length === 0
            ? "No terms have been set up for this school yet. An administrator creates the school's terms before a pupil can be billed or pay."
            : `No payments for ${termName} yet. Record the first one above.`
        }
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
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
