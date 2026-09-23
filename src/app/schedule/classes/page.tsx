import Link from "@/components/NextLink";
import { Button, TableCell, TableRow } from "@mui/material";

import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { listClasses } from "@/lib/data/queries";

export const metadata = {
  title: "Classes",
};

/**
 * The classes the timetable is built into, with their size.
 *
 * Read-only: a class is created and named by the administrator, and the officer
 * schedules into the classes that exist. Both counts come from `listClasses()`,
 * which resolves them with two batched queries rather than one per class.
 *
 * No role check: the `/schedule` layout has already loaded the shell context,
 * and RLS scopes the read.
 */
export default async function ScheduleClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const classes = await listClasses();

  const filtered = query
    ? classes.filter((classroom) =>
        [classroom.name, String(classroom.subjectCount), String(classroom.studentCount)].some(
          (field) => field.toLowerCase().includes(query),
        ),
      )
    : classes;

  const pupilTotal = classes.reduce((sum, row) => sum + row.studentCount, 0);

  const originalSubtitle =
    classes.length > 0
      ? `${classes.length} class${classes.length === 1 ? "" : "es"} with ${pupilTotal} pupil${pupilTotal === 1 ? "" : "s"}.`
      : "No classes yet.";

  const subtitle = query
    ? `Showing ${filtered.length} of ${classes.length} class${classes.length === 1 ? "" : "es"}.`
    : originalSubtitle;

  const emptyMessage =
    query && classes.length > 0
      ? `Nothing matches “${q}”.`
      : "No classes yet. An administrator creates classes and their subjects; once they exist, their week can be arranged here.";

  return (
    <>
      <PageHeader
        title="Classes"
        subtitle={subtitle}
        action={
          <Button component={Link} href="/schedule/timetable" variant="contained">
            Open the timetable
          </Button>
        }
      />

      <SearchBar placeholder="Search by class name" initialQuery={q} />

      <TableShell
        headers={["Class", "Subjects", "Pupils", ""]}
        density="compact"
        columnAlign={["left", "right", "right", "left"]}
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((classroom) => (
          <TableRow key={classroom.id}>
            <TableCell>{classroom.name}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {classroom.subjectCount}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {classroom.studentCount}
            </TableCell>
            <TableCell>
              <Button
                component={Link}
                href={`/schedule/timetable?class=${classroom.id}`}
                size="small"
                variant="outlined"
              >
                View week
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
