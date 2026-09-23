import { Box } from "@mui/material";

import EmptyState from "@/components/ui/EmptyState";
import NoticeCard from "@/components/ui/NoticeCard";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import { listNotices } from "@/lib/data/queries";

export const metadata = {
  title: "Notices",
};

/**
 * Notices for the officer's school, read-only.
 *
 * `listNotices()` already orders by date descending (then by creation time), so
 * the newest notice is first, and RLS scopes the rows to the school - there is no
 * filter here to forget.
 *
 * WHY THERE IS NO PUBLISH FORM, even though the role may post notices:
 * 20260101000950_staff_portals.sql grants `notices_insert_by_schedule_officer`,
 * so the database would accept one. But the only notice action the app has is
 * `createNoticeAction` in `@/lib/actions/content.ts`, and it opens with
 * `requireRoleWithTenant("admin")` - a schedule officer who submitted it would be
 * redirected to their own dashboard with no explanation. A button that silently
 * does nothing is worse than no button, and this portal does not own that action,
 * so the page stays a reading list, exactly like `teacher/notices`.
 *
 * No role check: the `/schedule` layout has already loaded the shell context.
 */
export default async function ScheduleNoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const notices = await listNotices();

  const filtered = query
    ? notices.filter((notice) =>
        [notice.title, notice.details].some((field) => (field ?? "").toLowerCase().includes(query)),
      )
    : notices;

  const originalSubtitle =
    notices.length > 0
      ? `${notices.length} notice${notices.length === 1 ? "" : "s"}, newest first.`
      : "Notices published by your school.";

  const subtitle = query
    ? `Showing ${filtered.length} of ${notices.length} notice${notices.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  return (
    <>
      <PageHeader title="Notices" subtitle={subtitle} />

      {notices.length === 0 ? (
        <EmptyState
          title="No notices yet"
          description="Notices published by your school appear here. Check back later."
        />
      ) : (
        <>
          <SearchBar placeholder="Search by title or details" initialQuery={q} />

          {filtered.length === 0 ? (
            <EmptyState
              title={`Nothing matches “${q}”`}
              description="Try a different word, or clear the search to see every notice."
            />
          ) : (
            <Box sx={{ display: "grid", gap: 2 }}>
              {filtered.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </Box>
          )}
        </>
      )}
    </>
  );
}
