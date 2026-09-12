import { Box, TableCell, TableRow } from "@mui/material";

import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
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
export default async function ComplaintsPage() {
  const complaints = await listComplaints();

  const subtitle =
    complaints.length === 0
      ? "Complaints students file from their portal appear here."
      : `${complaints.length} complaint${complaints.length === 1 ? "" : "s"} from students, newest first.`;

  return (
    <>
      <PageHeader title="Complaints" subtitle={subtitle} />

      <TableShell
        headers={["Student", "Date", "Complaint", "Actions"]}
        isEmpty={complaints.length === 0}
        emptyMessage="No complaints right now. Anything a student submits from their portal shows up here."
      >
        {complaints.map((complaint) => (
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
