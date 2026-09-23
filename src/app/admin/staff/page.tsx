import Link from "@/components/NextLink";
import { Box, Button, TableCell, TableRow, Typography } from "@mui/material";

import ConfirmActionButton from "@/components/ui/ConfirmActionButton";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import TableShell from "@/components/ui/TableShell";
import { deleteOfficeStaffAction } from "@/lib/actions/staff";
import { roleLabel } from "@/lib/auth/roles";
import { listOfficeStaff } from "@/lib/data/queries";

export const metadata = {
  title: "Office staff",
};

/**
 * The accountant and schedule officer accounts, in one list.
 *
 * Unlike the Administrators page next door, this one *does* have add and delete
 * controls. That is not a contradiction: administrator accounts are privileged
 * - they can reach everything - so they are only ever minted by the school
 * registering, whereas these two roles hold a deliberately narrow slice of
 * school data (finance, or the timetable), and a school office needs to be able
 * to hire and release them without a developer.
 *
 * Neither role can create the other, or itself: `createOfficeStaffAction`
 * requires the admin role.
 */
export default async function OfficeStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const staff = await listOfficeStaff();

  const filtered = query
    ? staff.filter((member) =>
        [member.fullName, member.email, roleLabel[member.role]].some((field) =>
          (field ?? "").toLowerCase().includes(query),
        ),
      )
    : staff;

  const originalSubtitle =
    staff.length === 0
      ? "No office staff yet."
      : `${staff.length} office staff account${staff.length === 1 ? "" : "s"} in your school.`;

  const subtitle = query
    ? `Showing ${filtered.length} of ${staff.length} office staff account${staff.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  const emptyMessage =
    query && staff.length > 0
      ? `Nothing matches “${q}”.`
      : "No office staff yet. Add an accountant or a schedule officer to give them their own portal.";

  return (
    <>
      <PageHeader
        title="Office staff"
        subtitle={subtitle}
        action={
          <Button component={Link} href="/admin/staff/add" variant="contained">
            Add staff account
          </Button>
        }
      />

      <SearchBar placeholder="Search by name, email or role" initialQuery={q} />

      <TableShell
        headers={["Name", "Email", "Role", "Actions"]}
        density="compact"
        columnAlign={["left", "left", "left", "left"]}
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.fullName}</TableCell>
            <TableCell>
              {member.email ? (
                member.email
              ) : (
                <Typography variant="body2" color="text.secondary">
                  -
                </Typography>
              )}
            </TableCell>
            <TableCell>{roleLabel[member.role]}</TableCell>
            <TableCell>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <ConfirmActionButton
                  action={deleteOfficeStaffAction}
                  fields={{ staffId: member.id }}
                  label="Delete"
                  confirmTitle="Delete this staff account?"
                  confirmMessage={`${member.fullName} will no longer be able to sign in to the ${roleLabel[member.role]} portal. This cannot be undone.`}
                />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
