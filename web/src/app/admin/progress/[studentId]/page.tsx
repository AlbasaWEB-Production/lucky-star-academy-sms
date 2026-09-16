import Link from "@/components/NextLink";
import { Box, Button, Paper, TableCell, TableRow, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import TableShell from "@/components/ui/TableShell";
import {
  getPassMark,
  getPupilAcademicProgress,
  getPupilAttendanceRate,
} from "@/lib/data/academics";
import { getPupilFeeBalance } from "@/lib/data/finance";
import { getStudentById } from "@/lib/data/queries";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Pupil progress",
};

/**
 * One pupil's whole journey: marks per term, attendance, and the current term's
 * fee balance.
 *
 * This is the admin side of the progress card. Reads go through RLS-scoped
 * views and single-row queries, so an admin sees this child in full while a
 * teacher only reaches a child in a class they teach. The pupil is deliberately
 * never ranked against anyone else on this page — it is their own record.
 *
 * Money is rendered with `formatCedis`; `null` values render as honest empty
 * states ("no assessment") rather than fabricated zeroes.
 */
export default async function AdminProgressPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const student = await getStudentById(studentId);
  if (!student) {
    notFound();
  }

  const [terms, attendanceRate, feeBalance, passMark] = await Promise.all([
    getPupilAcademicProgress(studentId),
    getPupilAttendanceRate(studentId),
    getPupilFeeBalance(studentId),
    getPassMark(),
  ]);

  const progressTerms = terms ?? [];

  // The most recent term (highest term number) is the headline figure; an
  // earlier term is only reachable by scrolling, which keeps the card honest
  // about "this term" without hiding history.
  const latestTerm = progressTerms[progressTerms.length - 1] ?? null;

  return (
    <>
      <PageHeader
        title={student.fullName}
        subtitle={`Roll number ${student.rollNumber} · ${student.className} · progress`}
        action={
          <Button component={Link} href={`/admin/students/${student.id}`} variant="outlined">
            Back to student record
          </Button>
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          mb: 4,
        }}
      >
        <StatCard
          label="Average mark"
          value={latestTerm?.averageMark ?? "—"}
          hint={latestTerm ? `${latestTerm.termName} · across assessed subjects` : "no term-scoped marks yet"}
          primary
        />
        <StatCard
          label="Attendance"
          value={attendanceRate == null ? "—" : `${attendanceRate}%`}
          hint="of recorded sessions"
          tone={attendanceRate == null ? "neutral" : attendanceRate >= 90 ? "deepGreen" : attendanceRate >= 75 ? "warning" : "error"}
        />
        <StatCard
          label="Fee balance"
          value={feeBalance == null ? "—" : formatCedis(feeBalance.balancePesewas)}
          hint={feeBalance ? `${formatCedis(feeBalance.paidPesewas)} paid of ${formatCedis(feeBalance.amountDuePesewas)}` : "no assessment this term"}
          tone={feeBalance == null ? "neutral" : feeBalance.balancePesewas > 0 ? "warning" : "deepGreen"}
        />
        <StatCard
          label="Pass mark"
          value={passMark}
          hint="the school's mark for passing a subject"
          tone="gold"
        />
      </Box>

      {progressTerms.length === 0 ? (
        <EmptyState
          title="No term-scoped marks yet"
          description="This pupil's marks are recorded per term. Record exam marks on the marking screen against a term to fill their progress; until then no average can be shown."
        />
      ) : (
        <Box sx={{ display: "grid", gap: 3, mb: 4 }}>
          {progressTerms
            .slice()
            .sort((a, b) => a.termNumber - b.termNumber)
            .map((term) => {
              const scored = term.subjects.filter((subject) => subject.marks !== null);
              const recorded = scored.length;
              const notRecorded = term.subjects.length - recorded;

              return (
                <Paper variant="outlined" key={term.termId} sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 2 }}>
                    <Box>
                      <Typography variant="h6">{term.termName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {term.startDate} to {term.endDate} · {recorded} of {term.subjects.length} subjects marked
                        {notRecorded > 0 ? ` · ${notRecorded} not yet` : ""}
                      </Typography>
                    </Box>
                    <Typography variant="h6" component="div" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {term.averageMark == null ? "—" : `${term.averageMark}%`}
                    </Typography>
                  </Box>

                  <TableShell
                    headers={["Subject", "Mark", "vs pass mark"]}
                    columnAlign={["left", "right", "right"]}
                    density="compact"
                    isEmpty={false}
                  >
                    {term.subjects.map((subject) => {
                      const mark = subject.marks;
                      return (
                        <TableRow key={subject.subjectId}>
                          <TableCell>{subject.subjectName}</TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                            {mark === null ? "Not marked" : mark}
                          </TableCell>
                          <TableCell align="right">
                            {mark === null ? (
                              "—"
                            ) : mark >= passMark ? (
                              <Box component="span" sx={{ color: "success.main", fontWeight: 600 }}>
                                Pass
                              </Box>
                            ) : (
                              <Box component="span" sx={{ color: "error.main", fontWeight: 600 }}>
                                Below
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableShell>
                </Paper>
              );
            })}
        </Box>
      )}
    </>
  );
}
