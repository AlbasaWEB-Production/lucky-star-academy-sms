import "server-only";

import { compareByCampusThenClass } from "@/lib/class-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdmissionStage } from "@/lib/admissions";

// Stage domain helpers live in `@/lib/admissions` (client-safe); re-export here
// so server callers keep one import path.
export {
  ADMISSION_STAGES,
  isTerminalStage,
  nextStage,
  stageLabel,
} from "@/lib/admissions";

export type { AdmissionStage };

/**
 * Admissions and capacity read layer — the Phase 4 slices.
 *
 * Same contract as `queries.ts` / `dashboard.ts` / `academics.ts` / `people.ts`:
 * no `where school_id = ...`, no role check. The three view readers go through
 * `security_invoker` views that each carry an in-view `jwt_role() = 'admin'`
 * gate (`v_admissions_funnel`, `v_new_enrolments_by_class_intake`,
 * `v_capacity_utilisation`), so an admin sees the school's rows and a teacher or
 * pupil sees none. `listAdmissions` reads `admissions` directly, which RLS
 * scopes to the caller's school and to admins only. If an admissions screen
 * shows the wrong rows, the policy in `20260101000700_admissions_capacity.sql`
 * is what to fix — not this file.
 *
 * As everywhere, PostgREST serialises `numeric` / `bigint` as JSON strings, so
 * every count and rate is coerced with `Number()`.
 */

// ---------------------------------------------------------------------------
// View models (camelCased)
// ---------------------------------------------------------------------------

export type AdmissionLead = {
  id: string;
  pupilName: string;
  guardianName: string | null;
  guardianPhone: string | null;
  source: string | null;
  stage: AdmissionStage;
  stageDate: string;
  intakeTerm: { id: string | null; name: string | null };
  className: string | null;
  receivedOn: string | null;
  submittedOn: string | null;
  offeredOn: string | null;
  enrolledOn: string | null;
  declinedOn: string | null;
};

export type AdmissionsFunnel = {
  stage: AdmissionStage;
  leads: number;
  /** Share of ALL leads currently in this stage; 0 until there is a lead. */
  conversionPercent: number;
};

export type NewEnrolmentsByClassIntake = {
  classId: string;
  className: string;
  campus: string | null;
  termId: string | null;
  termName: string | null;
  termNumber: number | null;
  enrolled: number;
};

export type CapacityUtilisation = {
  classId: string;
  className: string;
  campus: string | null;
  capacity: number | null;
  pupilCount: number;
  /** Active pupils as a share of capacity; null when capacity is not set. */
  utilisationPercent: number | null;
};

// ---------------------------------------------------------------------------
// Domain readers
// ---------------------------------------------------------------------------

/**
 * All admissions leads for the school, newest first, with the class and intake
 * term names resolved so the record screen can show them without a join in SQL.
 */
export async function listAdmissions(): Promise<AdmissionLead[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: leads }, { data: classes }, { data: terms }] = await Promise.all([
    supabase.from("admissions").select("*").order("created_at", { ascending: false }),
    supabase.from("classes").select("id, name"),
    supabase.from("terms").select("id, name"),
  ]);

  const classNameById = new Map<string, string>();
  for (const row of classes ?? []) {
    classNameById.set(row.id, row.name);
  }
  const termNameById = new Map<string, string>();
  for (const row of terms ?? []) {
    termNameById.set(row.id, row.name);
  }

  return (leads ?? []).map((row) => ({
    id: row.id,
    pupilName: row.pupil_name,
    guardianName: row.guardian_name,
    guardianPhone: row.guardian_phone,
    source: row.source,
    stage: row.stage as AdmissionStage,
    stageDate: row.stage_date,
    intakeTerm: {
      id: row.intake_term_id,
      name: row.intake_term_id ? (termNameById.get(row.intake_term_id) ?? null) : null,
    },
    className: row.class_id ? (classNameById.get(row.class_id) ?? null) : null,
    receivedOn: row.received_on,
    submittedOn: row.submitted_on,
    offeredOn: row.offered_on,
    enrolledOn: row.enrolled_on,
    declinedOn: row.declined_on,
  }));
}

/**
 * Leads per funnel stage, in stage order, with the conversion share of all
 * leads written beside each stage.
 */
export async function listAdmissionsFunnel(): Promise<AdmissionsFunnel[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("v_admissions_funnel")
    .select("stage, leads, conversion_percent");
  return (data ?? []).map((row) => ({
    stage: row.stage as AdmissionStage,
    leads: Number(row.leads),
    conversionPercent: Number(row.conversion_percent),
  }));
}

/**
 * Enrolled leads per class and the intake term they targeted, ordered by term
 * then class. An enrolled lead with no intake term still surfaces (term null).
 */
export async function listNewEnrolmentsByClassIntake(): Promise<NewEnrolmentsByClassIntake[]> {
  const supabase = await createSupabaseServerClient();
  // Sorted in JS, not by the view's `order by t.term_number, class_name`: the
  // class half of that was alphabetical, which puts KG before Nursery. See
  // `@/lib/class-order`.
  const { data } = await supabase
    .from("v_new_enrolments_by_class_intake")
    .select("class_id, class_name, campus, term_id, term_name, term_number, enrolled");
  return (data ?? [])
    .map((row) => ({
      classId: row.class_id,
      className: row.class_name,
      campus: row.campus,
      termId: row.term_id,
      termName: row.term_name,
      termNumber: row.term_number === null ? null : Number(row.term_number),
      enrolled: Number(row.enrolled),
    }))
    .sort(
      (a, b) =>
        (a.termNumber ?? 0) - (b.termNumber ?? 0) || compareByCampusThenClass(a, b),
    );
}

/**
 * Active pupils per class over the class's capacity. A class with no capacity
 * set has a null `utilisationPercent` — "not set", never a fabricated number.
 */
export async function listCapacityUtilisation(): Promise<CapacityUtilisation[]> {
  const supabase = await createSupabaseServerClient();
  // Sorted in JS for the same reason: the view's `order by c.campus, c.name`
  // read KG before Nursery.
  const { data } = await supabase
    .from("v_capacity_utilisation")
    .select("class_id, class_name, campus, capacity, pupil_count, utilisation_percent");
  return (data ?? [])
    .map((row) => ({
      classId: row.class_id,
      className: row.class_name,
      campus: row.campus,
      capacity: row.capacity === null ? null : Number(row.capacity),
      pupilCount: Number(row.pupil_count),
      utilisationPercent: row.utilisation_percent === null ? null : Number(row.utilisation_percent),
    }))
    .sort(compareByCampusThenClass);
}
