import type { ReactNode } from "react";

import AppShell from "@/components/layout/AppShell";
import { loadShellContext } from "@/lib/auth/shell-context";

/**
 * Layout for every /admin route.
 *
 * The role check happens here once, so individual admin pages do not each have
 * to repeat it.
 *
 * `force-dynamic` is required, not an optimisation choice. Every page in this
 * segment depends on the caller's session, so it must never be prerendered.
 * Without this, a build that happens to run without Supabase env vars would
 * statically bake in the "not configured" redirect from loadShellContext, and
 * deploying that build would send every admin route to the landing page
 * forever - even once the credentials were present.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { fullName, email, schoolName } = await loadShellContext("admin");

  return (
    <AppShell role="admin" fullName={fullName} email={email} schoolName={schoolName}>
      {children}
    </AppShell>
  );
}
