import { TableCell, TableRow, Typography } from "@mui/material";

import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
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
export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const admins = await listAdmins();

  const filtered = query
    ? admins.filter((admin) =>
        [admin.fullName, admin.email].some((field) =>
          (field ?? "").toLowerCase().includes(query),
        ),
      )
    : admins;

  const originalSubtitle =
    admins.length === 0
      ? "No administrators yet."
      : `${admins.length} administrator${admins.length === 1 ? "" : "s"} in your school.`;

  const subtitle = query
    ? `Showing ${filtered.length} of ${admins.length} administrator${admins.length === 1 ? "" : "s"}.`
    : originalSubtitle;

  const emptyMessage =
    query && admins.length > 0
      ? `Nothing matches “${q}”.`
      : "No administrators yet. An administrator account is created when a school registers.";

  return (
    <>
      <PageHeader title="Administrators" subtitle={subtitle} />

      <SearchBar placeholder="Search by name or email" initialQuery={q} />

      <TableShell
        headers={["Name", "Email"]}
        density="compact"
        columnAlign={["left", "left"]}
        isEmpty={filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        {filtered.map((admin) => (
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
