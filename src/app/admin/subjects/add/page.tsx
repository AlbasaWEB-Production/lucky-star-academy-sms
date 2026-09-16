import Link from "@/components/NextLink";
import { Button, Typography } from "@mui/material";

import SubjectForm from "@/components/admin/SubjectForm";
import PageHeader from "@/components/ui/PageHeader";
import { listClasses, listTeachers } from "@/lib/data/queries";

export const metadata = {
  title: "Add subject",
};

export default async function AddSubjectPage() {
  const [classes, teachers] = await Promise.all([listClasses(), listTeachers()]);

  if (classes.length === 0) {
    return (
      <>
        <PageHeader title="Add subject" />
        <Typography variant="body1" sx={{ mb: 2 }}>
          You need at least one class before you can add subjects.
        </Typography>
        <Button component={Link} href="/admin/classes/add" variant="contained">
          Create a class
        </Button>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Add subject"
        subtitle="Subjects belong to one class and may be assigned to a teacher straight away."
        action={
          <Button component={Link} href="/admin/subjects" variant="outlined">
            Back to subjects
          </Button>
        }
      />

      <SubjectForm classes={classes} teachers={teachers} />
    </>
  );
}
