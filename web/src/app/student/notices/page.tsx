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
 * Every notice for the student's school, read-only.
 *
 * `listNotices()` already sorts by date and then by insertion time, both
 * descending, so the newest notice is first without any further ordering here.
 * There is nothing for the student to do on this page, which is why it has no
 * client component of its own - the search bar is the only interactive part.
 */
export default async function StudentNoticesPage({
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
      : "Announcements from your school appear here.";

  const subtitle = query
    ? `Showing ${filtered.length} of ${notices.length} notice${notices.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  return (
    <>
      <PageHeader title="Notices" subtitle={subtitle} />

      {notices.length === 0 ? (
        <EmptyState
          title="No notices yet"
          description="When your school publishes a notice it will show up here. Check back later."
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
