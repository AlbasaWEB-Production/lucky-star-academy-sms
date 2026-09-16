import { Box, TableCell, TableRow } from "@mui/material";

import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { deleteComplaintAction } from "@/lib/actions/content";
import { listComplaints } from "@/lib/data/queries";

export const metadata = {
  title: "Complaints",
};

/**
 * Complaints raised by students, newest first.
 *
 * Complaints are authored by students only and read by the admin, so there is
 * no create form here - the student portal owns the write. The legacy page
 * showed a decorative checkbox per row; this replaces it with the action an
 * admin actually needs, which is deleting a complaint once it is dealt with.
 */
export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const complaints = await listComplaints();

  const filtered = query
    ? complaints.filter((complaint) =>
        [complaint.studentName, complaint.complaint, new Date(complaint.date).toLocaleDateString()]
          .some((field) => (field ?? "").toLowerCase().includes(query)),
      )
    : complaints;

  const originalSubtitle =
    complaints.length === 0
      ? "Complaints students file from their portal appear here."
      : `${complaints.length} complaint${complaints.length === 1 ? "" : "s"} from students, newest first.`;

  const subtitle = query
    ? `Showing ${filtered.length} of ${complaints.length} complaint${complaints.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  const emptyMessage =
    query && complaints.length > 0
      ? `Nothing matches “${q}”.`
      : "No complaints right now. Anything a student submits from their portal shows up here.";

  return (
    <>
      <PageHeader title="Complaints" subtitle={subtitle} />

      <SearchBar placeholder="Search by student or complaint text" initialQuery={q} />

      <TableShell
        headers={["Student", "Date", "Complaint", "Actions"]}
        density="compact"
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((complaint) => (
          <TableRow key={complaint.id}>
            <TableCell>{complaint.studentName}</TableCell>
            <TableCell>{new Date(complaint.date).toLocaleDateString()}</TableCell>
            <TableCell sx={{ maxWidth: 520, whiteSpace: "pre-wrap" }}>{complaint.complaint}</TableCell>
            <TableCell>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <ConfirmActionButton
                  action={deleteComplaintAction}
                  fields={{ complaintId: complaint.id }}
                  label="Delete"
                  confirmTitle="Delete this complaint?"
                  confirmMessage={`${complaint.studentName}'s complaint will be permanently removed. This cannot be undone.`}
                />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
