import { Box } from "@mui/material";

import EmptyState from "@/components/ui/EmptyState";
import NoticeCard from "@/components/ui/NoticeCard";
import PageHeader from "@/components/ui/PageHeader";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { listNotices } from "@/lib/data/queries";

export const metadata = {
  title: "Notices",
};

/**
 * Notices for the teacher's school, read-only.
 *
 * `listNotices()` already orders by date descending (then by creation time),
 * so the newest notice is first. Only an administrator publishes notices -
 * `notices_insert_by_admin` - which is why there is no form here. The legacy
 * SeeNotice component was the same read-only list, rendered on the home page.
 */
export default async function TeacherNoticesPage() {
  await requireRoleWithTenant("teacher");

  const notices = await listNotices();

  return (
    <>
      <PageHeader
        title="Notices"
        subtitle={
          notices.length > 0
            ? `${notices.length} notice${notices.length === 1 ? "" : "s"}, newest first.`
            : "Notices published by your school."
        }
      />

      {notices.length === 0 ? (
        <EmptyState
          title="No notices yet"
          description="Your school administrator publishes notices here. Check back later."
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2,
          }}
        >
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </Box>
      )}
    </>
  );
}
