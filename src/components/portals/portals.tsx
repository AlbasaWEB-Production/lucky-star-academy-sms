import type { ReactNode } from "react";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { ROLE_ORDER, roleLabel, roleSlug } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/supabase/database.types";

/**
 * The five portals, described once for every page that lists them.
 *
 * The landing page and the sign-in chooser both present these doors, and they
 * had drifted: the landing page carried the redesigned card (a door, with an
 * icon, a gold numeral and an arrow) while `/login` still showed a pre-redesign
 * `Paper` with a separate "Continue" button beside it. Two hand-maintained
 * lists of the same five portals, styled separately, is exactly how that
 * happens - so the order, the numeral, the sign-in href, the title and the copy
 * all live here now and both pages render `PortalCard` from it.
 *
 * Everything but the copy is derived. `ROLE_ORDER` decides the sequence, so the
 * landing page's 01-05 and the chooser's 01-05 cannot disagree, and a sixth
 * role is a one-line change here rather than an edit in two places.
 */

export type PortalCardData = {
  /** `/login/<roleSlug>` - the convention both pages rely on. */
  href: string;
  /** Two digits, from the role's position in `ROLE_ORDER`. */
  numeral: string;
  title: string;
  description: string;
  icon: ReactNode;
};

/**
 * What each portal is for. Deliberately shared word for word with the landing
 * page: a visitor who followed the "Sign in" button arrives at the same five
 * doors they just read about, which is the point of reconciling the two pages.
 *
 * A `Record<UserRole, ...>` rather than an array, so a new role fails to compile
 * here until someone writes its sentence.
 */
const COPY: Record<UserRole, { description: string; icon: ReactNode }> = {
  admin: {
    description: "Manage students, teachers, classes, subjects, notices and complaints.",
    icon: <AdminPanelSettingsIcon />,
  },
  teacher: {
    description: "Take attendance, record exam marks and review your classes.",
    icon: <MenuBookIcon />,
  },
  student: {
    description: "View your subjects, attendance and marks, and submit a complaint.",
    icon: <SchoolIcon />,
  },
  accountant: {
    description: "Issue fee assessments, bank payments and record school expenses.",
    icon: <AccountBalanceWalletIcon />,
  },
  schedule_officer: {
    description: "Build the weekly timetable so every class and teacher has its slots.",
    icon: <CalendarMonthIcon />,
  },
};

export const PORTAL_CARDS: PortalCardData[] = ROLE_ORDER.map((role, index) => ({
  href: `/login/${roleSlug[role]}`,
  numeral: String(index + 1).padStart(2, "0"),
  title: roleLabel[role],
  ...COPY[role],
}));

/**
 * How each role signs in, as one sentence rather than a note per card.
 *
 * Four of the five use an email address, so repeating "Signs in with an email
 * address" on four cards said less than saying it once - and the thing a
 * visitor actually needs to notice is the odd one out.
 */
export const SIGN_IN_NOTE =
  "Administrators, teachers, the accountant and the schedule officer sign in with an email address. Students sign in with a roll number and their name.";
