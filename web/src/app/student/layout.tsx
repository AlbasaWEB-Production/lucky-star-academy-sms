import type { ReactNode } from "react";

import AppShell from "@/components/layout/AppShell";
import { loadShellContext } from "@/lib/auth/shell-context";
import { getHeaderData } from "@/lib/data/header";

/**
 * Layout for every /student route.
 *
 * `force-dynamic` is required - see the note in the admin layout. These pages
 * depend on the caller's session and must never be prerendered.
 */
export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const { session, fullName, email, schoolName } = await loadShellContext("student");
  const headerData = await getHeaderData("student", session.id);

  return (
    <AppShell
      role="student"
      fullName={fullName}
      email={email}
      schoolName={schoolName}
      headerData={headerData}
    >
      {children}
    </AppShell>
  );
}
