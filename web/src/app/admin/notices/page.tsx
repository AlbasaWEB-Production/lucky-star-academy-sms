import Link from "@/components/NextLink";
import { Box, Button, TableCell, TableRow } from "@mui/material";

import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
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
export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const notices = await listNotices();

  const filtered = query
    ? notices.filter((notice) =>
        [notice.title, notice.details].some((field) =>
          (field ?? "").toLowerCase().includes(query),
        ),
      )
    : notices;

  const originalSubtitle =
    notices.length === 0
      ? "Notices you publish appear on every portal in your school."
      : `${notices.length} notice${notices.length === 1 ? "" : "s"}, newest first.`;

  const subtitle = query
    ? `Showing ${filtered.length} of ${notices.length} notice${notices.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  const emptyMessage =
    query && notices.length > 0
      ? `Nothing matches “${q}”.`
      : "No notices yet. Publish your first notice to reach every portal.";

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

      <SearchBar placeholder="Search by title or details" initialQuery={q} />

      <TableShell
        headers={["Title", "Date", "Details", "Actions"]}
        density="compact"
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((notice) => (
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
