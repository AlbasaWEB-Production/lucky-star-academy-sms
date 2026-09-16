import Link from "@/components/NextLink";
import { Button, Typography } from "@mui/material";

import AddStudentForm from "@/components/admin/AddStudentForm";
import PageHeader from "@/components/ui/PageHeader";
import { listClasses } from "@/lib/data/queries";

export const metadata = {
  title: "Add student",
};

export default async function AddStudentPage() {
  const classes = await listClasses();

  if (classes.length === 0) {
    return (
      <>
        <PageHeader title="Add student" />
        <Typography variant="body1" sx={{ mb: 2 }}>
          You need at least one class before you can add students.
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
        title="Add student"
        subtitle="Creates a student login that works with a roll number and name."
      />
      <AddStudentForm classes={classes} />
    </>
  );
}
