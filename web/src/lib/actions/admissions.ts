"use server";

import { revalidatePath } from "next/cache";

import { requireRoleWithTenant } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { ADMISSION_STAGES, type AdmissionStage } from "@/lib/data/admissions";
import {
  describeDatabaseError,
  fail,
  readString,
  succeed,
  type FormActionResult,
} from "@/lib/actions/result";

/**
 * Server actions for admissions and capacity.
 *
 * `admissions` is admin-only (RLS grants admins full CRUD and nobody else), so
 * every action re-checks the caller with `requireRoleWithTenant("admin")` even
 * though RLS would refuse the write anyway. A lead is created at `enquiry` and
 * advanced through `application` → `offer` → `enrolled` (or declined); each
 * advance stamps the matching milestone date. Enrolling requires the class the
 * pupil is joining, so `v_new_enrolments_by_class_intake` can attribute it.
 */

function today(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const SCREEN = "/admin/admissions";

/**
 * Records a new admissions lead. Always starts at `enquiry` with received-on
 * today — a prospect is an enquiry before it is anything else.
 */
export async function createAdmissionAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const pupilName = readString(formData, "pupilName");
  const guardianName = readString(formData, "guardianName");
  const guardianPhone = readString(formData, "guardianPhone");
  const source = readString(formData, "source");
  const intakeTermId = readString(formData, "intakeTermId");

  if (!pupilName) {
    return fail("Pupil name is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("admissions").insert({
    school_id: user.schoolId,
    pupil_name: pupilName,
    guardian_name: guardianName,
    guardian_phone: guardianPhone,
    source,
    intake_term_id: intakeTermId,
    stage: "enquiry",
    stage_date: today(),
    received_on: today(),
    created_by: user.id,
  });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(SCREEN);
  return succeed;
}

/**
 * Advances a lead to its next stage, stamping that stage's milestone date.
 * Enrolling (offer → enrolled) requires the class the pupil joined.
 */
export async function advanceAdmissionAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const admissionId = readString(formData, "admissionId");
  const nextStage = readString(formData, "nextStage") as AdmissionStage | null;
  const classId = readString(formData, "classId");

  if (!admissionId || !nextStage) {
    return fail("Missing admission or target stage.");
  }
  if (!ADMISSION_STAGES.includes(nextStage)) {
    return fail("That is not a valid admissions stage.");
  }

  const now = today();
  const update: TablesUpdate<"admissions"> = {
    stage: nextStage,
    stage_date: now,
  };

  if (nextStage === "enrolled") {
    if (!classId) {
      return fail("Choose the class the pupil enrolled into.");
    }
    update.class_id = classId;
    update.enrolled_on = now;
  } else if (nextStage === "application") {
    update.submitted_on = now;
  } else if (nextStage === "offer") {
    update.offered_on = now;
  } else if (nextStage === "declined") {
    update.declined_on = now;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("admissions").update(update).eq("id", admissionId);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(SCREEN);
  revalidatePath("/admin/analytics/admissions");
  return succeed;
}

/** Removes a lead the admin no longer wants to track. */
export async function deleteAdmissionAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const id = readString(formData, "admissionId");
  if (!id) {
    return fail("Missing admission.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("admissions").delete().eq("id", id);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(SCREEN);
  revalidatePath("/admin/analytics/admissions");
  return succeed;
}
