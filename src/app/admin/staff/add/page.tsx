import Link from "@/components/NextLink";
import { Button } from "@mui/material";

import AddOfficeStaffForm from "@/components/admin/AddOfficeStaffForm";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Add staff account",
};

export default async function AddOfficeStaffPage() {
  return (
    <>
      <PageHeader
        title="Add staff account"
        subtitle="Creates a sign-in for an accountant or a schedule officer."
        action={
          <Button component={Link} href="/admin/staff" variant="outlined">
            Back to office staff
          </Button>
        }
      />

      <AddOfficeStaffForm />
    </>
  );
}
