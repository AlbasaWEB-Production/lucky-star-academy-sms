import Link from "@/components/NextLink";
import { Button, TableCell, TableRow, Typography } from "@mui/material";

import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { listSubjects } from "@/lib/data/queries";
import { listSlotCountsBySubject } from "@/lib/data/timetable";

export const metadata = {
  title: "Subjects",
};

/**
 * Every subject, with the class it belongs to and how many slots it holds.
 *
 * Read-only, because a subject is the administrator's: the officer arranges
 * *when* a subject meets, never what it is. The `sessions` column is the school's
 * free-text pattern ("Mon, Wed") kept beside the real slots, so the officer can
 * see where the written pattern and the placed lessons disagree.
 *
 * `listSlotCountsBySubject()` omits subjects that hold no slot, so the count is
 * read with `?? 0` - and a zero is the actionable row on this page.
 *
 * No role check: the `/schedule` layout has already loaded the shell context,
 * and RLS scopes both reads.
 */
export default async function ScheduleSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const [subjects, slotCounts] = await Promise.all([listSubjects(), listSlotCountsBySubject()]);

  const slotsBySubject = new Map(slotCounts.map((row) => [row.subjectId, row.slotCount]));
  const rows = subjects.map((subject) => ({
    ...subject,
    slotCount: slotsBySubject.get(subject.id) ?? 0,
  }));

  const filtered = query
    ? rows.filter((row) =>
        [
          row.name,
          row.code,
          row.className,
          row.teacherName ?? "",
          row.sessions,
          String(row.slotCount),
        ].some((field) => field.toLowerCase().includes(query)),
      )
    : rows;

  const unplaced = rows.filter((row) => row.slotCount === 0).length;

  const originalSubtitle =
    subjects.length === 0
      ? "No subjects yet."
      : `${subjects.length} subject${subjects.length === 1 ? "" : "s"}, ${unplaced} still without a lesson in the week.`;

  const subtitle = query
    ? `Showing ${filtered.length} of ${subjects.length} subject${subjects.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  const emptyMessage =
    query && subjects.length > 0
      ? `Nothing matches “${q}”.`
      : "No subjects yet. A subject belongs to a class and is created by an administrator; once one exists it can be placed in the week.";

  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle={subtitle}
        action={
          <Button component={Link} href="/schedule/timetable" variant="contained">
            Open the timetable
          </Button>
        }
      />

      <SearchBar placeholder="Search by name, code, class, teacher or sessions" initialQuery={q} />

      <TableShell
        headers={["Subject", "Code", "Class", "Teacher", "Sessions", "Lessons", ""]}
        density="compact"
        minWidth={760}
        columnAlign={["left", "left", "left", "left", "left", "right", "left"]}
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.code}</TableCell>
            <TableCell>{row.className}</TableCell>
            <TableCell>{row.teacherName ?? "Unassigned"}</TableCell>
            <TableCell>{row.sessions}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {row.slotCount === 0 ? (
                <Typography variant="body2" color="warning.main">
                  Not placed
                </Typography>
              ) : (
                row.slotCount
              )}
            </TableCell>
            <TableCell>
              <Button
                component={Link}
                href={`/schedule/timetable?class=${row.classId}`}
                size="small"
                variant="outlined"
              >
                {row.slotCount === 0 ? "Place" : "View week"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
