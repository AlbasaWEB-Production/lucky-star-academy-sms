import Link from "@/components/NextLink";
import { Alert, Box, Button, Divider, Paper, TableCell, TableRow, Typography } from "@mui/material";

import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { getPaymentReceipt, listPaymentsForAssessment } from "@/lib/data/finance";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Payment receipt",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile money",
  bank: "Bank",
};

export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const receipt = await getPaymentReceipt(paymentId);

  if (!receipt) {
    return (
      <EmptyState
        title="Receipt not found"
        description="The payment may have been removed, or you are not allowed to read it. Use the payment ledger to find a receipt by its pupil or number."
        action={
          <Button component={Link} href="/admin/fees/payments" variant="outlined">
            Back to payments
          </Button>
        }
      />
    );
  }

  const history = await listPaymentsForAssessment(receipt.assessmentId);

  const paidSoFar = history.reduce(
    (total, p) => total + (p.isReversal ? -p.amountPesewas : p.amountPesewas),
    0,
  );
  const balancePesewas = receipt.assessmentAmountPesewas - paidSoFar;

  return (
    <>
      <PageHeader
        title={`Receipt ${receipt.receiptNumber}`}
        subtitle={`A numbered record of money received against an assessment. Reversals appear in the history below, never as deletions.`}
        action={
          <Button component={Link} href="/admin/fees/payments" variant="outlined">
            Back to payments
          </Button>
        }
      />

      {receipt.isReversal ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This receipt reverses an earlier payment, so it reduces what the pupil has paid rather
          than adding to it
          {receipt.reversalReason ? ` — reason: ${receipt.reversalReason}` : "."} The audit trail
          keeps both records; nothing is deleted.
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" } }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Received from
            </Typography>
            <Typography variant="body1">
              {receipt.studentName} · Roll {receipt.rollNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {receipt.className} — {receipt.termName}
            </Typography>
          </Box>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Amount
            </Typography>
            <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(receipt.amountPesewas)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {METHOD_LABELS[receipt.method] ?? receipt.method}
            </Typography>
          </Box>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Date & status
            </Typography>
            <Typography variant="body1">
              {new Date(receipt.paymentDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {receipt.isReversal ? "Reversal" : "Payment"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" } }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Assessment total
            </Typography>
            <Typography variant="body1" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(receipt.assessmentAmountPesewas)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Paid
            </Typography>
            <Typography variant="body1" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(paidSoFar)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Still owing
            </Typography>
            <Typography variant="body1" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(balancePesewas)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 0 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Payment history
        </Typography>
        <TableShell
          headers={["Receipt", "Amount", "Method", "Date", "Type", "Reason"]}
          density="compact"
          columnAlign={["right", "right", "left", "left", "left", "left"]}
          isEmpty={history.length === 0}
          emptyMessage="No payments recorded yet."
        >
          {history.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {payment.receiptNumber}
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCedis(payment.amountPesewas)}
              </TableCell>
              <TableCell>{METHOD_LABELS[payment.method] ?? payment.method}</TableCell>
              <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
              <TableCell>{payment.isReversal ? "Reversal" : "Payment"}</TableCell>
              <TableCell>{payment.reversalReason ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableShell>
      </Paper>
    </>
  );
}
