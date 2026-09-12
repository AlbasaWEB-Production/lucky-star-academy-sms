import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";
import { notFound } from "next/navigation";

import NoticeForm from "@/components/admin/NoticeForm";
import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import { deleteNoticeAction } from "@/lib/actions/content";
import { getNoticeById } from "@/lib/data/queries";

export const metadata = {
  title: "Notice",
};

/**
 * One notice: the read view and the edit form are the same screen, matching
 * the legacy flow where an admin opened a notice to change it.
 *
 * Next.js 16 hands route params in as a Promise, so they must be awaited.
 */
export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ noticeId: string }>;
}) {
  const { noticeId } = await params;

  const notice = await getNoticeById(noticeId);

  if (!notice) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={notice.title}
        subtitle={`Published ${new Date(notice.date).toLocaleDateString()}`}
        action={
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button component={Link} href="/admin/notices" variant="outlined">
              Back to notices
            </Button>

            <ConfirmActionButton
              action={deleteNoticeAction}
              fields={{ noticeId: notice.id }}
              label="Delete"
              variant="outlined"
              confirmTitle="Delete this notice?"
              confirmMessage={`"${notice.title}" will be removed from every portal it was published to. This cannot be undone.`}
            />
          </Box>
        }
      />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Edit notice
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Changes are visible to the whole school as soon as you save.
        </Typography>

        <NoticeForm notice={notice} />
      </Paper>
    </>
  );
}
