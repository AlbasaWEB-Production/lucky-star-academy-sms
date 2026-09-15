import Link from "@/components/NextLink";
import { Box, Button, TableCell, TableRow } from "@mui/material";

import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { deleteNoticeAction } from "@/lib/actions/content";
import { listNotices } from "@/lib/data/queries";

export const metadata = {
  title: "Notices",
};

/**
 * Every notice in the school, newest first.
 *
 * `listNotices()` is RLS-scoped, so it needs no school filter here - an admin
 * reads their own school's notices.
 */
export default async function NoticesPage() {
  const notices = await listNotices();

  const subtitle =
    notices.length === 0
      ? "Notices you publish appear on every portal in your school."
      : `${notices.length} notice${notices.length === 1 ? "" : "s"}, newest first.`;

  return (
    <>
      <PageHeader
        title="Notices"
        subtitle={subtitle}
        action={
          <Button component={Link} href="/admin/notices/add" variant="contained">
            Add notice
          </Button>
        }
      />

      <TableShell
        headers={["Title", "Date", "Details", "Actions"]}
        density="compact"
        isEmpty={notices.length === 0}
        emptyMessage="No notices yet. Publish your first notice to reach every portal."
      >
        {notices.map((notice) => (
          <TableRow key={notice.id}>
            <TableCell>{notice.title}</TableCell>
            <TableCell>{new Date(notice.date).toLocaleDateString()}</TableCell>
            <TableCell
              sx={{
                maxWidth: 420,
                whiteSpace: "pre-wrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {notice.details}
            </TableCell>
            <TableCell>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  component={Link}
                  href={`/admin/notices/${notice.id}`}
                  size="small"
                  variant="outlined"
                >
                  View / Edit
                </Button>

                <ConfirmActionButton
                  action={deleteNoticeAction}
                  fields={{ noticeId: notice.id }}
                  label="Delete"
                  confirmTitle="Delete this notice?"
                  confirmMessage={`"${notice.title}" will be removed from every portal it was published to. This cannot be undone.`}
                />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
