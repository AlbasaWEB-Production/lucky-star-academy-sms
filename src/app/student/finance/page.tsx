import { Box, Divider, Paper, TableCell, TableRow, Typography } from "@mui/material";

import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { listOwnFinance } from "@/lib/data/finance";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "My fees",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile money",
  bank: "Bank",
};

/** A supporting figure block, matching the student dashboard's `Figure`. */
function Figure({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Box sx={{ p: 2, borderRadius: "14px", border: "1px solid", borderColor: "divider" }}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h3" component="div" sx={{ lineHeight: 1.1, color: "secondary.main" }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

export default async function StudentFinancePage() {
  await requireRoleWithTenant("student");

  const assessments = await listOwnFinance();

  const totalDue = assessments.reduce((sum, row) => sum + row.amountPesewas, 0);
  const totalPaid = assessments.reduce((sum, row) => sum + row.paidPesewas, 0);
  const totalBalance = assessments.reduce((sum, row) => sum + row.balancePesewas, 0);

  // Group by term, keeping the assessment order the data layer returned.
  const byTerm: Array<{ termId: string; termName: string; rows: typeof assessments }> = [];
  for (const row of assessments) {
    const group = byTerm.find((item) => item.termId === row.termId);
    if (group) {
      group.rows.push(row);
    } else {
      byTerm.push({ termId: row.termId, termName: row.termName, rows: [row] });
    }
  }

  return (
    <>
      <PageHeader
        title="My fees"
        subtitle="What your school has billed you for this term, and the payments recorded against it."
      />

      {assessments.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            title="No fee assessment yet"
            description="When your school office bills your class, the amount you owe appears here with every payment recorded against it."
          />
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              mb: 4,
            }}
          >
            <Figure label="Total billed" value={formatCedis(totalDue)} hint="across every assessed term" />
            <Figure label="Total paid" value={formatCedis(totalPaid)} hint="payments and reversals counted" />
            <Figure
              label="Still owing"
              value={formatCedis(totalBalance)}
              hint={totalBalance > 0 ? "ask the office to record a payment" : "your fees are fully paid"}
            />
          </Box>

          {byTerm.map((term) => {
            const termDue = term.rows.reduce((sum, row) => sum + row.amountPesewas, 0);
            const termBalance = term.rows.reduce((sum, row) => sum + row.balancePesewas, 0);
            return (
              <Paper key={term.termId} variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{term.termName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Billed {formatCedis(termDue)} · still owing {formatCedis(termBalance)}
                    </Typography>
                  </Box>
                </Box>

                {term.rows.map((row) => (
                  <Box key={row.assessmentId} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Assessment
                        </Typography>
                        <Typography variant="body1">{formatCedis(row.amountPesewas)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Paid
                        </Typography>
                        <Typography variant="body1">{formatCedis(row.paidPesewas)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Balance
                        </Typography>
                        <Typography variant="body1">{formatCedis(row.balancePesewas)}</Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <TableShell
                      headers={["Receipt", "Amount", "Method", "Date", "Type"]}
                      density="compact"
                      columnAlign={["right", "right", "left", "left", "left"]}
                      isEmpty={row.payments.length === 0}
                      emptyMessage="No payments recorded against this assessment yet."
                    >
                      {row.payments.map((payment) => (
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
                        </TableRow>
                      ))}
                    </TableShell>
                  </Box>
                ))}
              </Paper>
            );
          })}
        </>
      )}
    </>
  );
}
