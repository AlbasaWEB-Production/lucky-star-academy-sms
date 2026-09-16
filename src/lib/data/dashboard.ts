import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Dashboard read layer.
 *
 * Same contract as `queries.ts`: no `where school_id = ...`, no role check.
 * Every one of these reads a view or function from
 * `supabase/migrations/20260101000200_dashboard_analytics.sql`, and each of
 * those is declared `security_invoker = true`, so Row Level Security on the
 * underlying tables decides the rows. A teacher calling `listAtRiskPupils()`
 * gets the pupils in the classes they teach; an admin gets the whole school.
 * If a dashboard shows the wrong rows, the policy is what to fix - not this
 * file.
 *
 * One Postgres detail worth knowing before reading the coercions below:
 * `numeric` and `bigint` columns do **not** arrive as JavaScript numbers.
 * PostgREST serialises `numeric` as a JSON string (`"87.5"`, not `87.5`), so
 * every rate, average and count is run through `Number()` here. Skipping that
 * is how a KPI tile ends up rendering `100.0` instead of `100%`.
 */

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

export type AttendanceRateByClass = {
  classId: string;
  className: string;
  campus: string | null;
  totalRegisters: number;
  present: number;
  absent: number;
  ratePercent: number;
};

export type MarksByClassSubject = {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  averageMark: number;
  studentCount: number;
};

export type EnrolmentByCampus = {
  /** `null` when a class has not been assigned a campus yet. */
  campus: string | null;
  studentCount: number;
};

export type AttendanceHeatmapCell = {
  classId: string;
  studentId: string;
  studentName: string;
  rollNumber: number;
  date: string;
  status: "Present" | "Absent";
};

export type TeacherSubjectLoad = {
  teacherId: string | null;
  teacherName: string;
  subjectCount: number;
};

export type AtRiskPupil = {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  campus: string | null;
  rollNumber: number;
  /** Human-readable rule that fired, e.g. `Attendance 71.4%; Below 40 in 2 subjects`. */
  reason: string;
};

export type TermSummary = {
  id: string;
  name: string;
  termNumber: number;
  startDate: string;
  endDate: string;
};

export type NewEnrolmentByTerm = {
  termId: string;
  termName: string;
  startDate: string;
  endDate: string;
  count: number;
  /** True for the term whose window contains today. */
  isCurrent: boolean;
};

/**
 * The at-risk rule, read live from `dashboard_thresholds`. These are the
 * school's numbers, not constants in the code - changing the row in the table
 * changes the list on the next render, with no deploy.
 */
export type AtRiskRule = {
  attendancePercent: number;
  subjectMinMark: number;
  minSubjects: number;
};

/** Grade band minimums, read live from `dashboard_thresholds`. */
export type GradeBands = {
  aMin: number;
  bMin: number;
  cMin: number;
  dMin: number;
  eMin: number;
};

export type DashboardThresholds = {
  atRisk: AtRiskRule;
  gradeBands: GradeBands;
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/**
 * Fallbacks used when a `dashboard_thresholds` row is missing. They mirror the
 * documented defaults in the migration, so a school that has never opened the
 * config table still gets the same numbers the SQL functions fall back to -
 * the app and the database must never disagree about the rule.
 */
const DEFAULT_AT_RISK: AtRiskRule = {
  attendancePercent: 80,
  subjectMinMark: 40,
  minSubjects: 2,
};

const DEFAULT_GRADE_BANDS: GradeBands = {
  aMin: 80,
  bMin: 70,
  cMin: 60,
  dMin: 50,
  eMin: 40,
};

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

function numberOr(fallback: number, raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * The school's metric configuration, with the migration's defaults filled in
 * for any key that has not been set.
 */
export async function getDashboardThresholds(): Promise<DashboardThresholds> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.from("dashboard_thresholds").select("key, value");

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]));

  return {
    atRisk: {
      attendancePercent: numberOr(
        DEFAULT_AT_RISK.attendancePercent,
        byKey.get("at_risk_attendance_percent"),
      ),
      subjectMinMark: numberOr(DEFAULT_AT_RISK.subjectMinMark, byKey.get("at_risk_subject_min_mark")),
      minSubjects: numberOr(DEFAULT_AT_RISK.minSubjects, byKey.get("at_risk_min_subjects")),
    },
    gradeBands: {
      aMin: numberOr(DEFAULT_GRADE_BANDS.aMin, byKey.get("grade_A_min")),
      bMin: numberOr(DEFAULT_GRADE_BANDS.bMin, byKey.get("grade_B_min")),
      cMin: numberOr(DEFAULT_GRADE_BANDS.cMin, byKey.get("grade_C_min")),
      dMin: numberOr(DEFAULT_GRADE_BANDS.dMin, byKey.get("grade_D_min")),
      eMin: numberOr(DEFAULT_GRADE_BANDS.eMin, byKey.get("grade_E_min")),
    },
  };
}

export type GradeLetter = "A" | "B" | "C" | "D" | "E" | "F";

/**
 * Buckets a mark into a grade letter using the configured band minimums.
 *
 * Pure, and used only on the server: the bucketing happens in the data layer
 * so the chart components receive plain `{ name, value }` series and never
 * need the bands themselves.
 */
export function gradeForMark(mark: number, bands: GradeBands): GradeLetter {
  if (mark >= bands.aMin) return "A";
  if (mark >= bands.bMin) return "B";
  if (mark >= bands.cMin) return "C";
  if (mark >= bands.dMin) return "D";
  if (mark >= bands.eMin) return "E";
  return "F";
}

// ---------------------------------------------------------------------------
// Terms
// ---------------------------------------------------------------------------

export async function listTerms(): Promise<TermSummary[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("terms")
    .select("id, name, term_number, start_date, end_date")
    .order("start_date");

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    termNumber: row.term_number,
    startDate: row.start_date,
    endDate: row.end_date,
  }));
}

/** Today as `YYYY-MM-DD` in the server's local timezone. */
function today(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * The term in session today.
 *
 * Deliberately resolves the same way `fn_at_risk_pupils()` resolves it -
 * prefer the window containing today, else the most recent term that has
 * already started - so the page's "This term" subtitle and the at-risk list
 * can never disagree about which term they mean.
 */
export async function getCurrentTerm(): Promise<TermSummary | null> {
  const terms = await listTerms();
  if (terms.length === 0) {
    return null;
  }

  const now = today();
  const active = terms.find((term) => term.startDate <= now && term.endDate >= now);
  if (active) {
    return active;
  }

  const started = terms.filter((term) => term.startDate <= now);
  return started.length > 0 ? started[started.length - 1] : terms[0];
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

/**
 * Attendance rate per class, already worst-first so the caller can render the
 * "needs attention" order without re-sorting.
 *
 * The rate is present entries / total register entries. A "register entry" is
 * one `attendance` row: one pupil, marked in one subject, on one day. So a
 * class marked in six subjects weighs six times a class marked in one - this
 * measures marking, not pupils.
 */
export async function listAttendanceRateByClass(): Promise<AttendanceRateByClass[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_attendance_rate_by_class")
    .select("class_id, class_name, campus, total_registers, present, absent, rate_percent");

  return (data ?? [])
    .map((row) => ({
      classId: row.class_id,
      className: row.class_name,
      campus: row.campus,
      totalRegisters: Number(row.total_registers),
      present: Number(row.present),
      absent: Number(row.absent),
      ratePercent: Number(row.rate_percent),
    }))
    .sort((a, b) => a.ratePercent - b.ratePercent);
}

/**
 * The whole-school rate, rolled up from the per-class rows rather than
 * averaged over them - a straight mean of class rates would let a class with
 * three register entries count as much as one with three hundred.
 */
export function overallAttendanceRate(rows: AttendanceRateByClass[]): number | null {
  const totals = rows.reduce(
    (acc, row) => ({
      present: acc.present + row.present,
      total: acc.total + row.totalRegisters,
    }),
    { present: 0, total: 0 },
  );

  if (totals.total === 0) {
    return null;
  }

  return Math.round((totals.present / totals.total) * 1000) / 10;
}

/**
 * One row per pupil per day for a class - the raw material for the attendance
 * heat map.
 *
 * The view returns a distinct (pupil, date, status) row, so a pupil marked in
 * three subjects on a day appears once. `since` is inclusive; omit it to read
 * the whole history the caller is allowed to see.
 */
export async function listClassAttendanceHeatmap(
  classId: string,
  options: { since?: string; until?: string } = {},
): Promise<AttendanceHeatmapCell[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("v_attendance_heatmap")
    .select("class_id, student_id, student_name, roll_number, date, status")
    .eq("class_id", classId);

  if (options.since) {
    query = query.gte("date", options.since);
  }
  if (options.until) {
    query = query.lte("date", options.until);
  }

  const { data } = await query.order("date").order("roll_number");

  return (data ?? []).map((row) => ({
    classId: row.class_id,
    studentId: row.student_id,
    studentName: row.student_name,
    rollNumber: Number(row.roll_number),
    date: row.date,
    status: row.status,
  }));
}

// ---------------------------------------------------------------------------
// Marks
// ---------------------------------------------------------------------------

export async function listMarksByClassSubject(): Promise<MarksByClassSubject[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_marks_by_class_subject")
    .select("class_id, class_name, subject_id, subject_name, avg_mark, student_count");

  return (data ?? []).map((row) => ({
    classId: row.class_id,
    className: row.class_name,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    averageMark: Number(row.avg_mark),
    studentCount: Number(row.student_count),
  }));
}

/**
 * The school-wide average mark, weighted by how many pupils each subject
 * average was taken over. Returns null when no marks have been recorded, so
 * the caller can render an empty state rather than a misleading `0`.
 */
export function overallAverageMark(rows: MarksByClassSubject[]): number | null {
  const weighted = rows.reduce(
    (acc, row) => ({
      total: acc.total + row.averageMark * row.studentCount,
      pupils: acc.pupils + row.studentCount,
    }),
    { total: 0, pupils: 0 },
  );

  if (weighted.pupils === 0) {
    return null;
  }

  return Math.round((weighted.total / weighted.pupils) * 10) / 10;
}

export type GradeBucket = {
  grade: GradeLetter;
  count: number;
};

/**
 * Grade distribution for one subject, bucketed against the configured bands.
 *
 * `exam_results` holds one mark per pupil per subject, so the counts sum to
 * the number of pupils with a mark - not to a number of exam sittings.
 */
export async function getGradeDistribution(
  subjectId: string,
  bands: GradeBands,
): Promise<GradeBucket[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_grade_distribution")
    .select("marks_obtained")
    .eq("subject_id", subjectId);

  const counts: Record<GradeLetter, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

  for (const row of data ?? []) {
    counts[gradeForMark(Number(row.marks_obtained), bands)] += 1;
  }

  return (["A", "B", "C", "D", "E", "F"] as GradeLetter[]).map((grade) => ({
    grade,
    count: counts[grade],
  }));
}

// ---------------------------------------------------------------------------
// Enrolment
// ---------------------------------------------------------------------------

export async function listEnrolmentByCampus(): Promise<EnrolmentByCampus[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.from("v_enrolment_by_campus").select("campus, student_count");

  return (data ?? [])
    .map((row) => ({
      campus: row.campus,
      studentCount: Number(row.student_count),
    }))
    .sort((a, b) => b.studentCount - a.studentCount);
}

/**
 * New pupils per term, from `students.created_at`.
 *
 * This is an enrolment-date trend, which is a weaker thing than an admissions
 * funnel: it says when a pupil row was created, not when an enquiry became an
 * application became an offer. Named accordingly. Pupils created before the
 * first configured term are not counted in any bucket, so the totals can be
 * lower than the roll - the caller labels it as "new this year", not "total".
 */
export async function listNewEnrolmentsByTerm(): Promise<NewEnrolmentByTerm[]> {
  const supabase = await createSupabaseServerClient();

  const [terms, students] = await Promise.all([
    listTerms(),
    supabase.from("students").select("created_at"),
  ]);

  if (terms.length === 0) {
    return [];
  }

  const now = today();
  const created = (students.data ?? []).map((row) => row.created_at);

  return terms.map((term) => ({
    termId: term.id,
    termName: term.name,
    startDate: term.startDate,
    endDate: term.endDate,
    count: created.filter((stamp) => {
      const date = stamp.slice(0, 10);
      return date >= term.startDate && date <= term.endDate;
    }).length,
    isCurrent: term.startDate <= now && term.endDate >= now,
  }));
}

// ---------------------------------------------------------------------------
// Teacher workload
// ---------------------------------------------------------------------------

/**
 * Subjects owned per teacher.
 *
 * The brief asked for periods per week. The schema has no period count -
 * `subjects.sessions` is free text like "Mon, Wed" - so this counts subjects,
 * and every surface that shows it says "subjects", never "periods".
 */
export async function listTeacherSubjectLoad(): Promise<TeacherSubjectLoad[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_teacher_subject_load")
    .select("teacher_id, teacher_name, subject_count");

  return (data ?? [])
    .map((row) => ({
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      subjectCount: Number(row.subject_count),
    }))
    .sort((a, b) => b.subjectCount - a.subjectCount || a.teacherName.localeCompare(b.teacherName));
}

// ---------------------------------------------------------------------------
// At-risk pupils
// ---------------------------------------------------------------------------

/**
 * Pupils meeting the configured at-risk rule, worst-first is not meaningful
 * here (a pupil either meets a rule or does not), so this keeps roll order.
 *
 * The rule itself lives in SQL (`fn_at_risk_pupils`) so the same definition is
 * used everywhere and the thresholds are read live. The behaviour-incident
 * signal the brief asked for is not here because there is no discipline table
 * to read; see DASHBOARD_BACKLOG.md.
 */
export async function listAtRiskPupils(): Promise<AtRiskPupil[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.rpc("fn_at_risk_pupils");

  return (data ?? []).map((row) => ({
    studentId: row.student_id,
    studentName: row.student_name,
    classId: row.class_id,
    className: row.class_name,
    campus: row.campus,
    rollNumber: Number(row.roll_number),
    reason: row.reason,
  }));
}
