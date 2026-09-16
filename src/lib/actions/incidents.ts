"use server";

import { revalidatePath } from "next/cache";

import { requireRoleWithTenant } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { INCIDENT_TYPES, type IncidentType } from "@/lib/incidents";
import {
  describeDatabaseError,
  fail,
  readString,
  succeed,
  type FormActionResult,
} from "@/lib/actions/result";

/**
 * Server actions for the incident register.
 *
 * `incidents` is admin-only for record/resolve/delete (RLS grants admins full
 * CRUD, teachers read-only on their classes, pupils read-only on their own), so
 * every action re-checks the caller with `requireRoleWithTenant("admin")` even
 * though RLS would refuse a teacher write anyway. `note` is kept short and
 * factual — the form is not prompted for health, family or home circumstances.
 */

function today(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const SCREEN = "/admin/incidents";
const TEACHER_SCREEN = "/teacher/incidents";
const WELFARE_SCREEN = "/admin/analytics/welfare";

/** Records a behavioural incident against a pupil, defaulting the date to today. */
export async function createIncidentAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const studentId = readString(formData, "studentId");
  const classId = readString(formData, "classId");
  const incidentType = readString(formData, "incidentType") as IncidentType | null;
  const note = readString(formData, "note");
  const date = readString(formData, "date") ?? today();

  if (!studentId || !classId) {
    return fail("Choose the pupil and their class.");
  }
  if (!incidentType || !INCIDENT_TYPES.includes(incidentType)) {
    return fail("Choose a valid incident type.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("incidents").insert({
    school_id: user.schoolId,
    student_id: studentId,
    class_id: classId,
    date,
    incident_type: incidentType,
    note,
    resolved: false,
    recorded_by: user.id,
  });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(SCREEN);
  revalidatePath(TEACHER_SCREEN);
  revalidatePath(WELFARE_SCREEN);
  return succeed;
}

/** Closes an incident, stamping the day it was resolved. */
export async function resolveIncidentAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const incidentId = readString(formData, "incidentId");
  if (!incidentId) {
    return fail("Missing incident.");
  }

  const update: TablesUpdate<"incidents"> = {
    resolved: true,
    resolved_on: today(),
  };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("incidents").update(update).eq("id", incidentId);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(SCREEN);
  revalidatePath(TEACHER_SCREEN);
  revalidatePath(WELFARE_SCREEN);
  return succeed;
}

/** Removes an incident the admin no longer wants on the register. */
export async function deleteIncidentAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const incidentId = readString(formData, "incidentId");
  if (!incidentId) {
    return fail("Missing incident.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("incidents").delete().eq("id", incidentId);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(SCREEN);
  revalidatePath(TEACHER_SCREEN);
  revalidatePath(WELFARE_SCREEN);
  return succeed;
}
