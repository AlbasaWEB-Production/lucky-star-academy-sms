import type { ReactNode } from "react";

import AppShell from "@/components/layout/AppShell";
import { loadShellContext } from "@/lib/auth/shell-context";
import { getHeaderData } from "@/lib/data/header";

/**
 * Layout for every /teacher route.
 *
 * `force-dynamic` is required - see the note in the admin layout. These pages
 * depend on the caller's session and must never be prerendered.
 */
export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const { session, fullName, email, schoolName } = await loadShellContext("teacher");
  const headerData = await getHeaderData("teacher", session.id);

  return (
    <AppShell
      role="teacher"
      fullName={fullName}
      email={email}
      schoolName={schoolName}
      headerData={headerData}
    >
      {children}
    </AppShell>
  );
}
