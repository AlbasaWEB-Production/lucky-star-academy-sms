import Link from "@/components/NextLink";
import { Button, Typography } from "@mui/material";

import AddTeacherForm from "@/components/admin/AddTeacherForm";
import PageHeader from "@/components/ui/PageHeader";
import { listClasses, listUnassignedSubjects } from "@/lib/data/queries";

export const metadata = {
  title: "Add teacher",
};

/**
 * Adding a teacher needs one extra read: which subjects have no teacher yet.
 * The picker is gathered per class because `listUnassignedSubjects` takes a
 * class id, and the reads run concurrently.
 */
export default async function AddTeacherPage() {
  const classes = await listClasses();

  const unassignedByClass = await Promise.all(
    classes.map((classroom) => listUnassignedSubjects(classroom.id)),
  );

  const subjects = unassignedByClass.flat().map((subject) => ({
    id: subject.id,
    name: subject.name,
    className: subject.className,
  }));

  return (
    <>
      <PageHeader
        title="Add teacher"
        subtitle="Creates a teacher login and, optionally, assigns them to a subject."
        action={
          <Button component={Link} href="/admin/teachers" variant="outlined">
            Back to teachers
          </Button>
        }
      />

      {classes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          There are no classes yet, so there is nothing to assign this teacher to. You can add one
          from the Classes page.
        </Typography>
      ) : null}

      <AddTeacherForm subjects={subjects} />
    </>
  );
}
