import "server-only";

import { compareByCampusThenClass } from "@/lib/class-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Incident type helpers live in `@/lib/incidents` (client-safe); re-export the
// label here so server callers keep one import path.
export { INCIDENT_TYPES, incidentTypeLabel, type IncidentType } from "@/lib/incidents";

/**
 * Welfare read layer — the Phase 5 slice.
 *
 * Same contract as `queries.ts` / `dashboard.ts` / `academics.ts` / `finance.ts`
 * / `admissions.ts`: no `where school_id = ...`, no role check. The two view
 * readers go through `security_invoker` views that each carry an in-view
 * `jwt_role() = 'admin'` gate (`v_incidents_by_type`,
 * `v_incidents_per_hundred_by_class`), so an admin sees the school's numbers and
 * a teacher or pupil sees none. `listIncidents` reads `incidents` directly,
 * which RLS scopes to the caller: an admin sees every row, a teacher only the
 * classes they teach, a pupil only their own. If an incidents screen shows the
 * wrong rows, the policies in `20260101000800_welfare_incidents.sql` are what
 * to fix — not this file.
 *
 * As everywhere, PostgREST serialises `numeric` / `bigint` as JSON strings, so
 * every count and rate is coerced with `Number()`.
 */

// ---------------------------------------------------------------------------
// View models (camelCased)
// ---------------------------------------------------------------------------

export type Incident = {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: number | null;
  className: string | null;
  campus: string | null;
  date: string;
  incidentType: string;
  note: string | null;
  resolved: boolean;
  resolvedOn: string | null;
};

export type IncidentsByType = {
  incidentType: string;
  incidentCount: number;
  resolvedCount: number;
  unresolvedCount: number;
};

export type IncidentsPerHundredByClass = {
  classId: string;
  className: string;
  campus: string | null;
  incidents: number;
  activePupils: number;
  /** Incidents per 100 active pupils; null when the class has no active pupils. */
  perHundred: number | null;
};

// ---------------------------------------------------------------------------
// Domain readers
// ---------------------------------------------------------------------------

/**
 * All incidents visible to the caller (admin = whole school, teacher = classes
 * they teach, pupil = own), newest first, with the pupil and class names resolved
 * so the register can show them without a join in SQL.
 */
export async function listIncidents(): Promise<Incident[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: incidents }, { data: students }, { data: profiles }, { data: classes }] =
    await Promise.all([
      supabase
        .from("incidents")
        .select("id, student_id, class_id, date, incident_type, note, resolved, resolved_on")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("students").select("id, roll_number"),
      supabase.from("profiles").select("id, full_name"),
      supabase.from("classes").select("id, name, campus"),
    ]);

  const studentById = new Map<string, { roll_number: number }>();
  for (const row of students ?? []) {
    studentById.set(row.id, { roll_number: row.roll_number });
  }
  const nameById = new Map<string, string>();
  for (const row of profiles ?? []) {
    nameById.set(row.id, row.full_name);
  }
  const classById = new Map<string, { name: string; campus: string | null }>();
  for (const row of classes ?? []) {
    classById.set(row.id, { name: row.name, campus: row.campus });
  }

  return (incidents ?? []).map((row) => ({
    id: row.id,
    studentId: row.student_id,
    studentName: nameById.get(row.student_id) ?? "Unknown pupil",
    rollNumber: studentById.get(row.student_id)?.roll_number ?? null,
    className: classById.get(row.class_id)?.name ?? null,
    campus: classById.get(row.class_id)?.campus ?? null,
    date: row.date,
    incidentType: row.incident_type,
    note: row.note,
    resolved: row.resolved,
    resolvedOn: row.resolved_on,
  }));
}

/** Incident count per type, in type order, with the resolved/unresolved split. */
export async function listIncidentsByType(): Promise<IncidentsByType[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("v_incidents_by_type")
    .select("incident_type, incident_count, resolved_count, unresolved_count");
  return (data ?? []).map((row) => ({
    incidentType: row.incident_type,
    incidentCount: Number(row.incident_count),
    resolvedCount: Number(row.resolved_count),
    unresolvedCount: Number(row.unresolved_count),
  }));
}

/**
 * Incidents per 100 active pupils per class, ordered by campus then name. A
 * class with no active pupils has a null `perHundred` — "not set", never a
 * fabricated number.
 */
export async function listIncidentsPerHundredByClass(): Promise<IncidentsPerHundredByClass[]> {
  const supabase = await createSupabaseServerClient();
  // Ordered in JS, not by the view's `order by c.campus, c.name`: alphabetically
  // "KG 1" precedes "Nursery 1", the reverse of the school's progression. See
  // `@/lib/class-order`.
  const { data } = await supabase
    .from("v_incidents_per_hundred_by_class")
    .select("class_id, class_name, campus, incidents, active_pupils, per_hundred");
  return (data ?? [])
    .map((row) => ({
      classId: row.class_id,
      className: row.class_name,
      campus: row.campus,
      incidents: Number(row.incidents),
      activePupils: Number(row.active_pupils),
      perHundred: row.per_hundred === null ? null : Number(row.per_hundred),
    }))
    .sort(compareByCampusThenClass);
}

/**
 * Unresolved incidents for one pupil — the welfare flag on the progress card.
 * 0 is honest (nothing open); the flag is surfaced only when this is > 0.
 * RLS scopes this to the pupil's own row (or an admin/teacher who may see it).
 */
export async function getUnresolvedIncidentsForPupil(studentId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("incidents")
    .select("id")
    .eq("student_id", studentId)
    .eq("resolved", false);
  return (data ?? []).length;
}
