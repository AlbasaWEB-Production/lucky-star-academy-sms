import Link from "@/components/NextLink";
import { Box, Button, TableCell, TableRow, Typography } from "@mui/material";

import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { deleteSubjectAction } from "@/lib/actions/roster";
import { listClasses, listSubjects } from "@/lib/data/queries";

export const metadata = {
  title: "Subjects",
};

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const [subjects, classes] = await Promise.all([listSubjects(), listClasses()]);

  const filtered = query
    ? subjects.filter((subject) =>
        [subject.name, subject.code, subject.className, subject.teacherName].some((field) =>
          (field ?? "").toLowerCase().includes(query),
        ),
      )
    : subjects;

  const unassigned = subjects.filter((subject) => subject.teacherId === null).length;

  const originalSubtitle =
    subjects.length === 0
      ? "No subjects yet."
      : `${subjects.length} subject${subjects.length === 1 ? "" : "s"}, ${unassigned} still without a teacher.`;

  const subtitle = query
    ? `Showing ${filtered.length} of ${subjects.length} subject${subjects.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  const emptyMessage =
    query && subjects.length > 0
      ? `Nothing matches “${q}”.`
      : "No subjects yet. Add a subject to a class, then assign a teacher to it.";

  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle={subtitle}
        action={
          <Button
            component={Link}
            href="/admin/subjects/add"
            variant="contained"
            disabled={classes.length === 0}
          >
            Add subject
          </Button>
        }
      />

      {classes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create a class first - every subject belongs to one.
        </Typography>
      ) : null}

      <SearchBar placeholder="Search by name, code, class or teacher" initialQuery={q} />

      <TableShell
        headers={["Subject name", "Code", "Class", "Teacher", "Actions"]}
        density="compact"
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((subject) => (
          <TableRow key={subject.id}>
            <TableCell>{subject.name}</TableCell>
            <TableCell>{subject.code}</TableCell>
            <TableCell>{subject.className}</TableCell>
            <TableCell>{subject.teacherName ?? "Unassigned"}</TableCell>
            <TableCell>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  component={Link}
                  href={`/admin/subjects/${subject.id}`}
                  size="small"
                  variant="outlined"
                >
                  View
                </Button>

                <ConfirmActionButton
                  action={deleteSubjectAction}
                  fields={{ subjectId: subject.id }}
                  label="Delete"
                  confirmTitle="Delete this subject?"
                  confirmMessage={`${subject.name} (${subject.code}) will be permanently removed, along with its attendance and exam records. This cannot be undone.`}
                />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
