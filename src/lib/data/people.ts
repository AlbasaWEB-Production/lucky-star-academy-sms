import "server-only";

import { compareByCampusThenClass } from "@/lib/class-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * People and teaching read layer - the Phase 3 slices.
 *
 * Same contract as `queries.ts` / `dashboard.ts` / `academics.ts`: no
 * `where school_id = ...`, no role check. The two view readers below go through
 * `security_invoker` views that each carry an in-view `jwt_role() = 'admin'`
 * gate (`v_pupil_teacher_ratio`, `v_teacher_attendance_rate`), so an admin sees
 * the school's rows and a teacher or pupil sees none - and RLS scopes the
 * underlying tables first. `listUncoveredSubjects` reads `subjects` directly,
 * which RLS scopes to the caller's school. If a people screen shows the wrong
 * rows, the policy in `20260101000600_people_teaching.sql` or on `subjects` is
 * what to fix - not this file.
 *
 * As everywhere, PostgREST serialises `numeric` / `bigint` as JSON strings, so
 * every count and rate is coerced with `Number()`.
 */

// ---------------------------------------------------------------------------
// View models (camelCased)
// ---------------------------------------------------------------------------

export type PupilTeacherRatio = {
  classId: string;
  className: string;
  campus: string | null;
  pupilCount: number;
  teacherCount: number;
  /** Pupils per assigned teacher; null when the class has no teacher yet. */
  ratio: number | null;
};

export type TeacherAttendanceRate = {
  teacherId: string;
  teacherName: string;
  recordedDays: number;
  presentTotal: number;
  absentTotal: number;
  /** Present share of recorded days over the current term; null when no records yet. */
  ratePercent: number | null;
};

export type UncoveredSubject = {
  subjectId: string;
  subjectName: string;
  code: string;
  classId: string;
  className: string;
  campus: string | null;
};

// ---------------------------------------------------------------------------
// Domain readers
// ---------------------------------------------------------------------------

/**
 * Active pupils per distinct teachers per class, one row per class.
 *
 * A class with no teacher assigned has a null ratio rather than a fabricated 0,
 * so the head can see the gap. Admin-only (in-view gate).
 */
export async function listPupilTeacherRatio(): Promise<PupilTeacherRatio[]> {
  const supabase = await createSupabaseServerClient();

  // Ordered in JS rather than with `.order("class_name")`: alphabetically "KG 1"
  // comes before "Nursery 1", which is the reverse of the school's progression.
  // See `@/lib/class-order`.
  const { data } = await supabase
    .from("v_pupil_teacher_ratio")
    .select("class_id, class_name, campus, pupil_count, teacher_count, ratio");

  return (data ?? [])
    .map((row) => ({
      classId: row.class_id,
      className: row.class_name,
      campus: row.campus,
      pupilCount: Number(row.pupil_count),
      teacherCount: Number(row.teacher_count),
      ratio: row.ratio == null ? null : Number(row.ratio),
    }))
    .sort(compareByCampusThenClass);
}

/**
 * Per-teacher present/absent totals over the current term window.
 *
 * Every teacher in the school appears - including those with no recorded days,
 * who carry a null rate shown as "no records yet" rather than a fabricated 0%.
 * The term is resolved inside the view exactly as `fn_at_risk_pupils()` resolves
 * it, so this screen and the at-risk list can never disagree about the term.
 * Admin-only (in-view gate).
 */
export async function listTeacherAttendanceRate(): Promise<TeacherAttendanceRate[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_teacher_attendance_rate")
    .select(
      "teacher_id, teacher_name, recorded_days, present_total, absent_total, rate_percent",
    )
    .order("teacher_name");

  return (data ?? []).map((row) => ({
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    recordedDays: Number(row.recorded_days),
    presentTotal: Number(row.present_total),
    absentTotal: Number(row.absent_total),
    ratePercent: row.rate_percent == null ? null : Number(row.rate_percent),
  }));
}

/**
 * Subjects that no teacher is assigned to yet - "who is covering what" gaps.
 *
 * `subjects.teacher_id IS NULL` is the single source of truth for an uncovered
 * subject (there is no separate link to disagree with). RLS scopes to the
 * caller's school; the people screen is admin-only.
 */
export async function listUncoveredSubjects(): Promise<UncoveredSubject[]> {
  const supabase = await createSupabaseServerClient();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, class_id")
    .is("teacher_id", null)
    .order("name");

  if (!subjects || subjects.length === 0) {
    return [];
  }

  const classIds = [...new Set(subjects.map((row) => row.class_id))];

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, campus")
    .in("id", classIds);

  const classById = new Map(
    (classes ?? []).map((row) => [row.id, { name: row.name, campus: row.campus }]),
  );

  return subjects.map((row) => {
    const cls = classById.get(row.class_id);
    return {
      subjectId: row.id,
      subjectName: row.name,
      code: row.code,
      classId: row.class_id,
      className: cls?.name ?? "Unknown class",
      campus: cls?.campus ?? null,
    };
  });
}
