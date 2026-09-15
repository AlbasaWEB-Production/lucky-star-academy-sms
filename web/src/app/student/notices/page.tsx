import { Box } from "@mui/material";

import EmptyState from "@/components/ui/EmptyState";
import NoticeCard from "@/components/ui/NoticeCard";
import PageHeader from "@/components/ui/PageHeader";
import { listNotices } from "@/lib/data/queries";

export const metadata = {
  title: "Notices",
};

/**
 * Every notice for the student's school, read-only.
 *
 * `listNotices()` already sorts by date and then by insertion time, both
 * descending, so the newest notice is first without any further ordering here.
 * There is nothing for the student to do on this page, which is why it has no
 * client component at all.
 */
export default async function StudentNoticesPage() {
  const notices = await listNotices();

  return (
    <>
      <PageHeader
        title="Notices"
        subtitle={
          notices.length > 0
            ? `${notices.length} notice${notices.length === 1 ? "" : "s"}, newest first.`
            : "Announcements from your school appear here."
        }
      />

      {notices.length === 0 ? (
        <EmptyState
          title="No notices yet"
          description="When your school publishes a notice it will show up here. Check back later."
        />
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </Box>
      )}
    </>
  );
}
