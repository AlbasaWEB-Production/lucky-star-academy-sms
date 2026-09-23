import { Suspense } from "react";
import Link from "@/components/NextLink";
import { Box, Button, Skeleton, TableCell, TableRow } from "@mui/material";

import UrlFilterSelect from "@/components/dashboard/UrlFilterSelect";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { getCurrentTerm, listTerms } from "@/lib/data/dashboard";
import { listFeeStatusByStudent } from "@/lib/data/finance";
import { formatCedis } from "@/lib/money";

export const metadata = {
  title: "Fee overview",
};

/**
 * Fee status per pupil for one term - the school's debtor list.
 *
 * The columns are the admin fee overview's defaulter columns (pupil, class,
 * campus, billed, paid, still owing) and the page defaults to the term in
 * session, so the two screens read the same way. It is a `TableShell` rather
 * than the admin's client-side `DataTable` because this page is searched from
 * the URL: the filter is a `?q=` the server applies, with the three states the
 * house conventions require ("Showing X of Y", the original empty message, and
 * `Nothing matches “…”`).
 *
 * Two independent URL parameters live here: `?term=` (which term to show) and
 * `?q=` (the search). Both components that write them merge into the existing
 * query string rather than replacing it, so typing a search keeps the chosen
 * term and choosing a term keeps the search. (This page is the reason
 * `SearchBar` merges: it used to rebuild the query string from scratch, which
 * dropped `?term=` and silently fell back to the term in session.)
 *
 * No role check: the accountant layout has already guarded the route, and
 * `v_fee_status_by_student` is scoped by RLS (and gated to admin/teacher/
 * accountant), so a pupil never reaches this list.
 */
export default async function AccountantFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; term?: string }>;
}) {
  const { q = "", term } = await searchParams;
  const query = q.trim().toLowerCase();

  const [terms, currentTerm] = await Promise.all([listTerms(), getCurrentTerm()]);

  const termId = term ?? currentTerm?.id ?? terms[0]?.id ?? "";
  const selectedTerm = terms.find((item) => item.id === termId);
  const termOptions = terms.map((item) => ({ value: item.id, label: item.name }));
  const termName = selectedTerm?.name ?? "the selected term";

  const feeStatus = termId ? await listFeeStatusByStudent(termId) : [];

  // Largest debt first, so the pupils to chase are at the top; pupils who have
  // settled keep their name order at the bottom of the list.
  const byDebt = [...feeStatus].sort(
    (a, b) => b.balancePesewas - a.balancePesewas || a.studentName.localeCompare(b.studentName),
  );

  const filtered = query
    ? byDebt.filter((row) =>
        [row.studentName, row.className, row.campus ?? "—"].some((field) =>
          field.toLowerCase().includes(query),
        ),
      )
    : byDebt;

  const owingCount = feeStatus.filter((row) => row.balancePesewas > 0).length;

  const originalSubtitle =
    feeStatus.length > 0
      ? `${owingCount} of ${feeStatus.length} pupils billed for ${termName} still owe money. Largest debt first.`
      : terms.length === 0
        ? "No terms have been set up for this school yet, so there is nothing to bill."
        : `No pupil has been billed for ${termName} yet.`;

  const subtitle = query
    ? `Showing ${filtered.length} of ${feeStatus.length} pupils billed for ${termName}.`
    : originalSubtitle;

  const emptyMessage =
    query && feeStatus.length > 0
      ? `Nothing matches “${q}”.`
      : terms.length === 0
        ? "No terms have been set up for this school yet. An administrator creates the school's terms before a class can be billed."
        : `No pupil has been billed for ${termName} yet. Issue the term's assessments to bill a class, then the debtors appear here.`;

  return (
    <>
      <PageHeader
        title="Fee overview"
        subtitle={subtitle}
        action={
          <Button component={Link} href="/accountant/fees/payments" variant="outlined">
            Record payment
          </Button>
        }
      />

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <SearchBar placeholder="Search by pupil, class or campus" initialQuery={q} />

        <Suspense fallback={<Skeleton variant="rounded" height={40} width={180} />}>
          <UrlFilterSelect name="term" label="Term" value={termId} options={termOptions} />
        </Suspense>
      </Box>

      <TableShell
        headers={["Pupil", "Class", "Campus", "Amount due", "Paid", "Still owing"]}
        density="compact"
        columnAlign={["left", "left", "left", "right", "right", "right"]}
        minWidth={760}
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((row) => (
          <TableRow key={row.studentId}>
            <TableCell>{row.studentName}</TableCell>
            <TableCell>{row.className}</TableCell>
            <TableCell>{row.campus ?? "—"}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(row.amountDuePesewas)}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(row.paidPesewas)}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCedis(row.balancePesewas)}
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
