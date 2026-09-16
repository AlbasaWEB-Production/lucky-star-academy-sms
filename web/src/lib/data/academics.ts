import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listTerms, type TermSummary } from "@/lib/data/dashboard";

/**
 * Academics read layer - the Phase 2 term-aware slices.
 *
 * Same contract as `queries.ts` / `dashboard.ts` / `finance.ts`: no
 * `where school_id = ...`, no role check. Every read below goes through a
 * `security_invoker` view (or is one query per row, RLS-scoped), so an admin
 * sees the whole school, a teacher sees the classes they teach, and a pupil
 * sees only their own marks. If an academics screen shows the wrong rows, the
 * policy in `20260101000500_deepen_academics.sql` is what to fix - not this
 * file.
 *
 * As everywhere, PostgREST serialises `numeric` / `bigint` as JSON strings, so
 * every rate, average and count is coerced with `Number()`.
 */

// ---------------------------------------------------------------------------
// View models (camelCased)
// ---------------------------------------------------------------------------

export type EnrolmentTrendByClassCampus = {
  classId: string;
  className: string;
  campus: string | null;
  termId: string;
  termName: string;
  termNumber: number;
  enrolled: number;
};

export type RetentionDropout = {
  termId: string;
  termName: string;
  termNumber: number;
  retained: number;
  leftSchool: number;
  changesTotal: number;
  /** Retained as a share of total status changes; null when there were none. */
  retentionRatePercent: number | null;
};

export type PassPromotionRates = {
  classId: string;
  className: string;
  termId: string;
  termName: string;
  passedMarks: number;
  totalMarks: number;
  passRatePercent: number | null;
  promotedPupils: number;
  assessedPupils: number;
  promotionRatePercent: number | null;
};

export type ClassAverageTrend = {
  classId: string;
  className: string;
  termId: string;
  termName: string;
  termNumber: number;
  avgMark: number | null;
  marksCount: number;
  pupilsAssessed: number;
};

export type PupilProgressSubject = {
  subjectId: string;
  subjectName: string;
  /** `null` when the pupil has no mark in that subject for the term. */
  marks: number | null;
};

export type PupilProgressTerm = {
  termId: string;
  termName: string;
  termNumber: number;
  startDate: string;
  endDate: string;
  averageMark: number | null;
  subjects: PupilProgressSubject[];
};

// ---------------------------------------------------------------------------
// Domain readers
// ---------------------------------------------------------------------------

/**
 * How many pupils joined each class on each campus during each term, from a
 * pupil's real `enrolled_at` day. Pupils whose enrolment date is unknown are
 * not guessed into a term, so the per-term totals can be lower than the roll -
 * the caller labels it "enrolled this term", never "total".
 */
export async function listEnrolmentTrendByClassCampus(): Promise<EnrolmentTrendByClassCampus[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_enrolment_trend_by_class_campus")
    .select(
      "class_id, class_name, campus, term_id, term_name, term_number, enrolled",
    )
    .order("term_number")
    .order("class_name");

  return (data ?? []).map((row) => ({
    classId: row.class_id,
    className: row.class_name,
    campus: row.campus,
    termId: row.term_id,
    termName: row.term_name,
    termNumber: Number(row.term_number),
    enrolled: Number(row.enrolled),
  }));
}

/**
 * Retained vs pupils who left, per term, counted in the term where a pupil's
 * status last changed (`students.status_date`). A pupil currently 'active' or
 * 'completed' counts as retained; 'withdrawn' or 'transferred' as left.
 */
export async function listRetentionDropout(): Promise<RetentionDropout[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_retention_dropout")
    .select("term_id, term_name, term_number, retained, left_school, changes_total")
    .order("term_number");

  return (data ?? []).map((row) => {
    const changesTotal = Number(row.changes_total);
    const retained = Number(row.retained);
    return {
      termId: row.term_id,
      termName: row.term_name,
      termNumber: Number(row.term_number),
      retained,
      leftSchool: Number(row.left_school),
      changesTotal,
      retentionRatePercent:
        changesTotal > 0 ? Math.round((retained / changesTotal) * 1000) / 10 : null,
    };
  });
}

/**
 * Pass rate and promotion rate per class and term, against the configured pass
 * mark (read inside the view via `fn_pass_mark()`). A mark passes at >= the
 * mark; a pupil is promoted when the average of their assessed marks meets it.
 */
export async function listPassPromotionRates(): Promise<PassPromotionRates[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_pass_promotion_rates")
    .select(
      "class_id, class_name, term_id, term_name, passed_marks, total_marks, pass_rate_percent, promoted_pupils, assessed_pupils, promotion_rate_percent",
    )
    .order("term_name")
    .order("class_name");

  return (data ?? []).map((row) => ({
    classId: row.class_id,
    className: row.class_name,
    termId: row.term_id,
    termName: row.term_name,
    passedMarks: Number(row.passed_marks),
    totalMarks: Number(row.total_marks),
    passRatePercent: row.pass_rate_percent == null ? null : Number(row.pass_rate_percent),
    promotedPupils: Number(row.promoted_pupils),
    assessedPupils: Number(row.assessed_pupils),
    promotionRatePercent:
      row.promotion_rate_percent == null ? null : Number(row.promotion_rate_percent),
  }));
}

/**
 * Average mark per class per term - the line the class-average trend chart
 * draws. One row per class per term; marks recorded with no term are excluded.
 */
export async function listClassAverageTrend(): Promise<ClassAverageTrend[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_class_average_trend")
    .select(
      "class_id, class_name, term_id, term_name, term_number, avg_mark, marks_count, pupils_assessed",
    )
    .order("term_number")
    .order("class_name");

  return (data ?? []).map((row) => ({
    classId: row.class_id,
    className: row.class_name,
    termId: row.term_id,
    termName: row.term_name,
    termNumber: Number(row.term_number),
    avgMark: row.avg_mark == null ? null : Number(row.avg_mark),
    marksCount: Number(row.marks_count),
    pupilsAssessed: Number(row.pupils_assessed),
  }));
}

/**
 * The school's configured pass mark, read from `dashboard_thresholds`.
 *
 * Mirrors `fn_pass_mark()`: the key's numeric value, else the conventional 50.
 * Kept here (rather than only in SQL) so a page can display "pass mark: 50"
 * next to a pass/fail list - the app and the database must never disagree.
 */
export async function getPassMark(): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("dashboard_thresholds")
    .select("value")
    .eq("key", "pass_mark")
    .maybeSingle();

  if (!data) {
    return 50;
  }
  const parsed = Number(data.value);
  return Number.isFinite(parsed) ? parsed : 50;
}

/**
 * One pupil's marks, grouped per term - the raw material for both the admin
 * progress page and a pupil's own progress page.
 *
 * Only rows with a term are returned (a mark recorded before terms existed has
 * no term and would otherwise render under a fabricated "no term" bucket). A
 * pupil's class defines the subjects listed: every subject is included even
 * when the pupil has no mark yet, so the page can show an honest "not marked"
 * rather than silently omitting it.
 *
 * Returns `null` when the pupil does not exist.
 */
export async function getPupilAcademicProgress(
  studentId: string,
): Promise<PupilProgressTerm[] | null> {
  const supabase = await createSupabaseServerClient();

  const [studentResult, terms] = await Promise.all([
    supabase
      .from("students")
      .select("class_id")
      .eq("id", studentId)
      .maybeSingle(),
    listTerms(),
  ]);

  const student = studentResult.data;
  if (!student) {
    return null;
  }

  const [subjectsResult, marksResult] = await Promise.all([
    supabase.from("subjects").select("id, name").eq("class_id", student.class_id),
    supabase
      .from("exam_results")
      .select("subject_id, marks_obtained, term_id")
      .eq("student_id", studentId),
  ]);

  const subjects = (subjectsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }));

  // Index marks by (term_id) -> (subject_id) -> marks so the group below is a
  // single pass.
  const marksByTerm = new Map<string, Map<string, number>>();
  for (const mark of marksResult.data ?? []) {
    if (!mark.term_id) {
      continue;
    }
    let bySubject = marksByTerm.get(mark.term_id);
    if (!bySubject) {
      bySubject = new Map();
      marksByTerm.set(mark.term_id, bySubject);
    }
    bySubject.set(mark.subject_id, Number(mark.marks_obtained));
  }

  const termsPresent = terms.filter((term) => marksByTerm.has(term.id));

  return termsPresent.map((term) => {
    const bySubject = marksByTerm.get(term.id)!;
    const subjectRows = subjects.map((subject) => {
      const marks = bySubject.get(subject.id);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        marks: marks ?? null,
      };
    });

    const scored = subjectRows
      .filter((row): row is PupilProgressSubject & { marks: number } => row.marks !== null)
      .map((row) => row.marks);

    const averageMark =
      scored.length > 0
        ? Math.round((scored.reduce((sum, marks) => sum + marks, 0) / scored.length) * 10) / 10
        : null;

    return {
      termId: term.id,
      termName: term.name,
      termNumber: term.termNumber,
      startDate: term.startDate,
      endDate: term.endDate,
      averageMark,
      subjects: subjectRows,
    };
  });
}

/**
 * A pupil's attendance rate (present / total register entries) for the whole
 * history the caller is allowed to see. `null` when the pupil has no register
 * entries, so the caller can render an empty state rather than a misleading 0.
 */
export async function getPupilAttendanceRate(studentId: string): Promise<number | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("attendance")
    .select("status")
    .eq("student_id", studentId);

  const rows = data ?? [];
  if (rows.length === 0) {
    return null;
  }

  const present = rows.filter((row) => row.status === "Present").length;
  return Math.round((present / rows.length) * 1000) / 10;
}
