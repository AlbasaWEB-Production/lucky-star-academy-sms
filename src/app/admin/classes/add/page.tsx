import Link from "@/components/NextLink";
import { Button } from "@mui/material";

import AddClassForm from "@/components/admin/AddClassForm";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Add class",
};

export default function AddClassPage() {
  return (
    <>
      <PageHeader
        title="Add class"
        subtitle="A class groups the students who sit together and the subjects taught to them."
        action={
          <Button component={Link} href="/admin/classes" variant="outlined">
            Back to classes
          </Button>
        }
      />

      <AddClassForm />
    </>
  );
}
