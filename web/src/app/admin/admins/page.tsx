import { TableCell, TableRow, Typography } from "@mui/material";

import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { listAdmins } from "@/lib/data/queries";

export const metadata = {
  title: "Administrators",
};

/**
 * Read-only list of administrator profiles.
 *
 * This page deliberately has no add/delete controls. Administrator accounts
 * are created by the school through registration and sign-in; a staff member
 * must not be able to mint or remove a privileged account from inside the
 * portal. The school's people are still counted as one family here, which is
 * why the sidebar's "People" section lists Administrators alongside Students
 * and Teachers.
 */
export default async function AdminsPage() {
  const admins = await listAdmins();

  const subtitle =
    admins.length === 0
      ? "No administrators yet."
      : `${admins.length} administrator${admins.length === 1 ? "" : "s"} in your school.`;

  return (
    <>
      <PageHeader title="Administrators" subtitle={subtitle} />

      <TableShell
        headers={["Name", "Email"]}
        density="compact"
        columnAlign={["left", "left"]}
        isEmpty={admins.length === 0}
        emptyMessage="No administrators yet. An administrator account is created when a school registers."
      >
        {admins.map((admin) => (
          <TableRow key={admin.id}>
            <TableCell>{admin.fullName}</TableCell>
            <TableCell>
              {admin.email ? (
                admin.email
              ) : (
                <Typography variant="body2" color="text.secondary">
                  -
                </Typography>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableShell>
    </>
  );
}
