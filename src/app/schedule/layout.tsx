import type { ReactNode } from "react";

import AppShell from "@/components/layout/AppShell";
import { loadShellContext } from "@/lib/auth/shell-context";
import { getHeaderData } from "@/lib/data/header";

/**
 * Layout for every /schedule route.
 *
 * The route segment is `/schedule` while the role is `schedule_officer`; see
 * `roleSlug` in `@/lib/auth/roles` for why.
 *
 * `force-dynamic` is required - see the note in the admin layout. These pages
 * depend on the caller's session and must never be prerendered.
 */
export const dynamic = "force-dynamic";

export default async function ScheduleOfficerLayout({ children }: { children: ReactNode }) {
  const { session, fullName, email, schoolName } = await loadShellContext("schedule_officer");
  const headerData = await getHeaderData("schedule_officer", session.id);

  return (
    <AppShell
      role="schedule_officer"
      fullName={fullName}
      email={email}
      schoolName={schoolName}
      headerData={headerData}
    >
      {children}
    </AppShell>
  );
}
