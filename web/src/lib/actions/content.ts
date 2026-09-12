"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRoleWithTenant, requireTenant } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  describeDatabaseError,
  fail,
  readString,
  succeed,
  type FormActionResult,
} from "@/lib/actions/result";

/**
 * Server actions for notices and complaints.
 *
 * Notices are published by the admin and read by the whole school.
 * Complaints are written by students and reviewed by the admin, matching the
 * legacy `complainSchema` where the author was always a student.
 */

// ---------------------------------------------------------------------------
// Notices
// ---------------------------------------------------------------------------

export async function createNoticeAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const title = readString(formData, "title");
  const details = readString(formData, "details");
  const date = readString(formData, "date");

  if (!title || !details) {
    return fail("A title and the notice text are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notices").insert({
    school_id: user.schoolId,
    title,
    details,
    // The column defaults to current_date, so an empty date field is fine.
    ...(date ? { date } : {}),
    created_by: user.id,
  });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/notices");
  redirect("/admin/notices");
}

export async function updateNoticeAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const id = readString(formData, "noticeId");
  const title = readString(formData, "title");
  const details = readString(formData, "details");
  const date = readString(formData, "date");

  if (!id || !title || !details) {
    return fail("A title and the notice text are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("notices")
    .update({ title, details, ...(date ? { date } : {}) })
    .eq("id", id);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/notices");
  redirect("/admin/notices");
}

export async function deleteNoticeAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const id = readString(formData, "noticeId");

  if (!id) {
    return fail("Missing notice.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notices").delete().eq("id", id);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/notices");
  return succeed;
}

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------

/**
 * Files a complaint as the signed-in student.
 *
 * `student_id` is taken from the session rather than from the form, and the
 * policy's WITH CHECK clause pins it to `auth.uid()` as well, so a student
 * cannot file a complaint in another student's name.
 */
export async function createComplaintAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireTenant();

  if (user.role !== "student") {
    return fail("Only students can submit a complaint.");
  }

  const complaint = readString(formData, "complaint");
  const date = readString(formData, "date");

  if (!complaint) {
    return fail("Please describe the issue before submitting.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("complaints").insert({
    school_id: user.schoolId,
    student_id: user.id,
    complaint,
    ...(date ? { date } : {}),
  });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/student/complaints");
  return succeed;
}

export async function deleteComplaintAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const id = readString(formData, "complaintId");

  if (!id) {
    return fail("Missing complaint.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("complaints").delete().eq("id", id);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/complaints");
  return succeed;
}
