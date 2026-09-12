import Link from "@/components/NextLink";
import { Button } from "@mui/material";

import NoticeForm from "@/components/admin/NoticeForm";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Add notice",
};

export default async function AddNoticePage() {
  return (
    <>
      <PageHeader
        title="Add notice"
        subtitle="Published notices are readable by everyone in your school."
        action={
          <Button component={Link} href="/admin/notices" variant="outlined">
            Back to notices
          </Button>
        }
      />

      <NoticeForm />
    </>
  );
}
