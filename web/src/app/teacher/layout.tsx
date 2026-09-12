import type { ReactNode } from "react";

import AppShell from "@/components/layout/AppShell";
import { loadShellContext } from "@/lib/auth/shell-context";

/**
 * Layout for every /teacher route.
 *
 * `force-dynamic` is required - see the note in the admin layout. These pages
 * depend on the caller's session and must never be prerendered.
 */
export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const { fullName, email, schoolName } = await loadShellContext("teacher");

  return (
    <AppShell role="teacher" fullName={fullName} email={email} schoolName={schoolName}>
      {children}
    </AppShell>
  );
}
