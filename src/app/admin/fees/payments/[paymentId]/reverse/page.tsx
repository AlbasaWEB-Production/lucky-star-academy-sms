import Link from "@/components/NextLink";
import { Button, Paper, Typography } from "@mui/material";

import ReversePaymentForm from "@/components/admin/fees/ReversePaymentForm";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { getPaymentReceipt } from "@/lib/data/finance";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Reverse payment",
};

export default async function ReversePaymentPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const receipt = await getPaymentReceipt(paymentId);

  if (!receipt || receipt.isReversal) {
    return (
      <EmptyState
        title="This payment cannot be reversed"
        description="A payment can only be reversed once — a reversal is itself never reversed again. The payment may also have been removed, or you are not allowed to read it."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Reverse payment"
        subtitle="Instead of deleting, a payment is corrected with a compensating record so the audit trail holds."
        action={
          <Button component={Link} href="/admin/fees/payments" variant="outlined">
            Back to payments
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Payment being reversed</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Receipt {receipt.receiptNumber} — {receipt.studentName} ({receipt.className}) for{" "}
          {formatCedis(receipt.amountPesewas)} on{" "}
          {new Date(receipt.paymentDate).toLocaleDateString()}. A reason is required below.
        </Typography>
      </Paper>

      <ReversePaymentForm paymentId={paymentId} />
    </>
  );
}
