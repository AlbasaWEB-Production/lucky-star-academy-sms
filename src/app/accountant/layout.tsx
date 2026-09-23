import type { ReactNode } from "react";

import AppShell from "@/components/layout/AppShell";
import { loadShellContext } from "@/lib/auth/shell-context";
import { getHeaderData } from "@/lib/data/header";

/**
 * Layout for every /accountant route.
 *
 * `force-dynamic` is required - see the note in the admin layout. These pages
 * depend on the caller's session and must never be prerendered.
 */
export const dynamic = "force-dynamic";

export default async function AccountantLayout({ children }: { children: ReactNode }) {
  const { session, fullName, email, schoolName } = await loadShellContext("accountant");
  const headerData = await getHeaderData("accountant", session.id);

  return (
    <AppShell
      role="accountant"
      fullName={fullName}
      email={email}
      schoolName={schoolName}
      headerData={headerData}
    >
      {children}
    </AppShell>
  );
}
