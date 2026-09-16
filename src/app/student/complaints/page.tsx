import { Paper, TableCell, TableRow, Typography } from "@mui/material";

import ComplaintForm from "@/components/student/ComplaintForm";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { listComplaints } from "@/lib/data/queries";

export const metadata = {
  title: "Complaints",
};

/**
 * The student's complaints: a form to file a new one, and their history below.
 *
 * `listComplaints()` is the same helper the admin portal uses, but the
 * `complaints_select` policy scopes a student to rows whose `student_id` is
 * their own, so this page shows their history and nothing else without needing
 * a filter of its own.
 *
 * No student id is passed to the form - the server action takes the author from
 * the session.
 */
export default async function StudentComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const complaints = await listComplaints();

  const filtered = query
    ? complaints.filter((complaint) =>
        [complaint.complaint, new Date(complaint.date).toLocaleDateString()].some((field) =>
          (field ?? "").toLowerCase().includes(query),
        ),
      )
    : complaints;

  const historyCaption = query
    ? `Showing ${filtered.length} of ${complaints.length} complaint${complaints.length === 1 ? "" : "s"}.`
    : complaints.length > 0
      ? `${complaints.length} complaint${complaints.length === 1 ? "" : "s"}, newest first.`
      : "Nothing filed yet.";

  const emptyMessage =
    query && complaints.length > 0
      ? `Nothing matches “${q}”.`
      : "You have not submitted a complaint yet. Use the form above if something needs the school's attention.";

  // Passed to the form so the date field's default value is rendered by the
  // server and matches exactly on hydration. Complaints default to the current
  // date in the database too, so leaving the field alone is safe.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Complaints"
        subtitle="Tell your school what went wrong. Only you and the school office can see this."
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Submit a complaint
        </Typography>
        <ComplaintForm today={today} />
      </Paper>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Your previous complaints
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {historyCaption}
      </Typography>

      {complaints.length > 0 ? (
        <SearchBar placeholder="Search your complaints" initialQuery={q} />
      ) : null}

      <TableShell
        headers={["Date", "Your complaint"]}
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((complaint) => (
          <TableRow key={complaint.id}>
            <TableCell sx={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
              {new Date(complaint.date).toLocaleDateString()}
            </TableCell>
            <TableCell sx={{ whiteSpace: "pre-wrap" }}>{complaint.complaint}</TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
