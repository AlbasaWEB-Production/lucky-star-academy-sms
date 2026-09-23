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
 * Notices for the accountant's school, read-only.
 *
 * `listNotices()` already orders by date descending (then by creation time), so
 * the newest notice is first - the same list the teacher and student portals
 * read. There is no "new notice" form and no link to one, deliberately:
 *
 *  - The accountant does hold `notices_insert_by_accountant` in RLS
 *    (`20260101000950_staff_portals.sql`), so the database is ready for the fee
 *    reminders this role has a reason to write.
 *  - But the only notice action that exists is `createNoticeAction` in
 *    `@/lib/actions/content.ts`, which is guarded with
 *    `requireRoleWithTenant("admin")` and redirects to `/admin/notices` - a
 *    route `src/proxy.ts` keeps the accountant out of. A form wired to it would
 *    appear to save and then bounce the accountant to their dashboard with
 *    nothing written, so this page stays read-only until the notice actions are
 *    widened for the role.
 *
 * No role check: `src/app/accountant/layout.tsx` has already run
 * `loadShellContext("accountant")`.
 */
export default async function AccountantNoticesPage({
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
          description="Your school administrator publishes notices here. Check back later."
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
            <Box
              sx={{
                display: "grid",
                gap: 2,
              }}
            >
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
