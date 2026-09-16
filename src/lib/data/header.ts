import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/database.types";

/**
 * Header data for the signed-in shell.
 *
 * Computed once per request on the server, so Row Level Security scopes every
 * row: the notification feed and the calendar days are exactly what the role
 * can see. The client `AppShell` receives this as plain, serialisable props
 * and never touches the database.
 */

export type HeaderNotice = {
  id: string;
  label: string;
  href: string;
};

export type CalendarDay = {
  date: string;
  kinds: string[];
};

export type HeaderData = {
  today: string;
  notifications: HeaderNotice[];
  calendar: CalendarDay[];
};

// ---------------------------------------------------------------------------
// Date helpers (local, not UTC, so day boundaries match the school's day)
// ---------------------------------------------------------------------------

function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function plural(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// ---------------------------------------------------------------------------
// Per-role notification feeds
// ---------------------------------------------------------------------------

async function adminNotifications(
  today: string,
  weekAgoIso: string,
): Promise<HeaderNotice[]> {
  const supabase = await createSupabaseServerClient();
  const items: HeaderNotice[] = [];

  const [{ count: complaintCount }, { data: unassigned }, { data: classRows }, { data: coveredRows }, { count: noticeCount }] =
    await Promise.all([
      supabase.from("complaints").select("*", { count: "exact", head: true }).gte("date", weekAgoIso),
      supabase.from("subjects").select("id").is("teacher_id", null),
      supabase.from("classes").select("id"),
      supabase.from("attendance").select("class_id").eq("date", today),
      supabase.from("notices").select("*", { count: "exact", head: true }).gte("date", weekAgoIso),
    ]);

  if (complaintCount) {
    items.push({
      id: "complaints",
      label: `${plural(complaintCount, "new complaint", "new complaints")}`,
      href: "/admin/complaints",
    });
  }

  if (unassigned && unassigned.length) {
    items.push({
      id: "subjects",
      label: `${plural(unassigned.length, "subject without a teacher", "subjects without a teacher")}`,
      href: "/admin/subjects",
    });
  }

  const covered = new Set((coveredRows ?? []).map((row) => row.class_id));
  const withoutAttendance = (classRows ?? []).filter((row) => !covered.has(row.id));
  if (withoutAttendance.length) {
    items.push({
      id: "attendance",
      label: `${plural(withoutAttendance.length, "class without attendance today", "classes without attendance today")}`,
      href: "/admin/attendance",
    });
  }

  if (noticeCount) {
    items.push({
      id: "notices",
      label: `${plural(noticeCount, "new notice", "new notices")}`,
      href: "/admin/notices",
    });
  }

  return items;
}

async function teacherNotifications(
  teacherId: string,
  today: string,
  weekAgoIso: string,
): Promise<HeaderNotice[]> {
  const supabase = await createSupabaseServerClient();
  const items: HeaderNotice[] = [];

  const [{ data: subjects }, { count: noticeCount }] = await Promise.all([
    supabase.from("subjects").select("id, class_id").eq("teacher_id", teacherId),
    supabase.from("notices").select("*", { count: "exact", head: true }).gte("date", weekAgoIso),
  ]);

  const classIds = Array.from(new Set((subjects ?? []).map((row) => row.class_id)));
  let needAttendance = 0;
  if (classIds.length) {
    const subjectIds = (subjects ?? []).map((row) => row.id);
    const { data: rows } = await supabase
      .from("attendance")
      .select("class_id")
      .eq("date", today)
      .in("subject_id", subjectIds);
    const covered = new Set((rows ?? []).map((row) => row.class_id));
    needAttendance = classIds.filter((id) => !covered.has(id)).length;
  }

  if (needAttendance) {
    items.push({
      id: "attendance",
      label: `${plural(needAttendance, "of your classes still needs attendance", "of your classes still need attendance")}`,
      href: "/teacher/attendance",
    });
  }

  if (noticeCount) {
    items.push({
      id: "notices",
      label: `${plural(noticeCount, "new notice", "new notices")}`,
      href: "/teacher/notices",
    });
  }

  return items;
}

async function studentNotifications(
  studentId: string,
  weekAgoIso: string,
  weekAgoTimestamp: string,
): Promise<HeaderNotice[]> {
  const supabase = await createSupabaseServerClient();
  const items: HeaderNotice[] = [];

  const [{ count: noticeCount }, { count: markCount }] = await Promise.all([
    supabase.from("notices").select("*", { count: "exact", head: true }).gte("date", weekAgoIso),
    supabase
      .from("exam_results")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .gte("created_at", weekAgoTimestamp),
  ]);

  if (noticeCount) {
    items.push({
      id: "notices",
      label: `${plural(noticeCount, "new notice", "new notices")}`,
      href: "/student/notices",
    });
  }

  if (markCount) {
    items.push({
      id: "marks",
      label: `${plural(markCount, "newly recorded mark", "newly recorded marks")}`,
      href: "/student/dashboard",
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Calendar days for the current month
// ---------------------------------------------------------------------------

async function calendarDays(monthStartIso: string, monthEndIso: string): Promise<CalendarDay[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: noticeRows }, { data: attendanceRows }] = await Promise.all([
    supabase.from("notices").select("date").gte("date", monthStartIso).lte("date", monthEndIso),
    supabase.from("attendance").select("date").gte("date", monthStartIso).lte("date", monthEndIso),
  ]);

  const byDate = new Map<string, Set<string>>();
  for (const row of noticeRows ?? []) {
    let set = byDate.get(row.date);
    if (!set) {
      set = new Set();
      byDate.set(row.date, set);
    }
    set.add("notice");
  }
  for (const row of attendanceRows ?? []) {
    let set = byDate.get(row.date);
    if (!set) {
      set = new Set();
      byDate.set(row.date, set);
    }
    set.add("attendance");
  }

  return Array.from(byDate.entries())
    .map(([date, kinds]) => ({ date, kinds: Array.from(kinds) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function getHeaderData(role: UserRole, userId: string): Promise<HeaderData> {
  const now = new Date();
  const today = localIsoDate(now);
  const weekAgoIso = localIsoDate(addDays(now, -7));
  const weekAgoTimestamp = addDays(now, -7).toISOString();

  const monthStartIso = localIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEndIso = localIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const [notifications, calendar] = await Promise.all([
    (async () => {
      if (role === "admin") return adminNotifications(today, weekAgoIso);
      if (role === "teacher") return teacherNotifications(userId, today, weekAgoIso);
      return studentNotifications(userId, weekAgoIso, weekAgoTimestamp);
    })(),
    calendarDays(monthStartIso, monthEndIso),
  ]);

  return { today, notifications, calendar };
}
