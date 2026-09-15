import Link from "@/components/NextLink";
import { Box, Button, TableCell, TableRow } from "@mui/material";

import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { deleteClassAction } from "@/lib/actions/roster";
import { listClasses } from "@/lib/data/queries";

export const metadata = {
  title: "Classes",
};

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const classes = await listClasses();

  const filtered = query
    ? classes.filter((classroom) =>
        [classroom.name, String(classroom.studentCount), String(classroom.subjectCount)].some(
          (field) => field.toLowerCase().includes(query),
        ),
      )
    : classes;

  const studentTotal = classes.reduce((sum, row) => sum + row.studentCount, 0);

  const originalSubtitle =
    classes.length > 0
      ? `${classes.length} class${classes.length === 1 ? "" : "es"} with ${studentTotal} student${studentTotal === 1 ? "" : "s"}.`
      : "No classes yet.";

  const subtitle = query
    ? `Showing ${filtered.length} of ${classes.length} class${classes.length === 1 ? "" : "es"}.`
    : originalSubtitle;

  const emptyMessage =
    query && classes.length > 0
      ? `Nothing matches “${q}”.`
      : "No classes yet. Add your first class, then students and subjects can be added to it.";

  return (
    <>
      <PageHeader
        title="Classes"
        subtitle={subtitle}
        action={
          <Button component={Link} href="/admin/classes/add" variant="contained">
            Add class
          </Button>
        }
      />

      <SearchBar placeholder="Search by class name" initialQuery={q} />

      <TableShell
        headers={["Class name", "Students", "Subjects", "Actions"]}
        density="compact"
        columnAlign={["left", "right", "right", "left"]}
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((classroom) => (
          <TableRow key={classroom.id}>
            <TableCell>{classroom.name}</TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {classroom.studentCount}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {classroom.subjectCount}
            </TableCell>
            <TableCell>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  component={Link}
                  href={`/admin/classes/${classroom.id}`}
                  size="small"
                  variant="outlined"
                >
                  View
                </Button>

                <ConfirmActionButton
                  action={deleteClassAction}
                  fields={{ classId: classroom.id }}
                  label="Delete"
                  confirmTitle="Delete this class?"
                  confirmMessage={`${classroom.name} and its ${classroom.subjectCount} subject${classroom.subjectCount === 1 ? "" : "s"} will be permanently removed. A class can only be deleted once it has no students. This cannot be undone.`}
                />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
