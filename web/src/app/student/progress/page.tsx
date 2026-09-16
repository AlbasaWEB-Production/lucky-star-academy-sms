import { Box, Paper, TableCell, TableRow, Typography } from "@mui/material";

import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import TableShell from "@/components/ui/TableShell";
import { requireRoleWithTenant } from "@/lib/auth/session";
import {
  getPassMark,
  getPupilAcademicProgress,
  getPupilAttendanceRate,
} from "@/lib/data/academics";
import { getPupilFeeBalance } from "@/lib/data/finance";
import { getOwnStudentRecord } from "@/lib/data/queries";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "My progress",
};

/**
 * A pupil's own progress card: marks per term, attendance and the current
 * term's fee balance.
 *
 * Unlike the admin view, this page reads ONLY the signed-in pupil's rows — the
 * `getOwnStudentRecord` guard plus RLS on every query behind it — so a pupil
 * can never see another child's marks, attendance or balance. The pupil is
 * never ranked against anyone else here.
 */
export default async function StudentProgressPage() {
  const session = await requireRoleWithTenant("student");
  const student = await getOwnStudentRecord(session.id);

  if (!student) {
    return (
      <>
        <PageHeader title="My progress" />
        <EmptyState
          title="Your student record is not ready yet"
          description="Your login works, but no student record is linked to it, so your marks and attendance cannot be shown. Ask your school office to complete your enrolment, then sign in again."
        />
      </>
    );
  }

  const [terms, attendanceRate, feeBalance, passMark] = await Promise.all([
    getPupilAcademicProgress(session.id),
    getPupilAttendanceRate(session.id),
    getPupilFeeBalance(session.id),
    getPassMark(),
  ]);

  const progressTerms = terms ?? [];
  const latestTerm = progressTerms[progressTerms.length - 1] ?? null;

  return (
    <>
      <PageHeader
        title="My progress"
        subtitle={`${student.className} · your marks, attendance and fees`}
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
          description="Your marks are recorded per term. Once your school records an exam mark in a term, your progress appears here."
        />
      ) : (
        <Box sx={{ display: "grid", gap: 3 }}>
          {progressTerms
            .slice()
            .sort((a, b) => a.termNumber - b.termNumber)
            .map((term) => {
              const scored = term.subjects.filter((subject) => subject.marks !== null);
              const recorded = scored.length;

              return (
                <Paper variant="outlined" key={term.termId} sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 2 }}>
                    <Box>
                      <Typography variant="h6">{term.termName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {recorded} of {term.subjects.length} subjects marked
                      </Typography>
                    </Box>
                    <Typography variant="h6" component="div" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {term.averageMark == null ? "—" : `${term.averageMark}%`}
                    </Typography>
                  </Box>

                  <TableShell
                    headers={["Subject", "Mark", "result"]}
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
