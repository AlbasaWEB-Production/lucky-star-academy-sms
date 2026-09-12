"use server";

import { revalidatePath } from "next/cache";

import { requireStaffWithTenant } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  describeDatabaseError,
  fail,
  readString,
  succeed,
  type FormActionResult,
} from "@/lib/actions/result";

/**
 * Server actions for records: attendance and exam marks.
 *
 * Both roles may call these, and RLS decides what each may actually write:
 * `attendance_insert_by_admin_or_teacher` and the matching exam_results policy
 * allow an admin across the school, and a teacher only where
 * `subjects.teacher_id` is their own id. A teacher therefore cannot post marks
 * for a colleague's subject even by crafting the request by hand.
 *
 * Bulk rows arrive as a JSON string in the `entries` field. This keeps the
 * form a single request - the legacy app issued one PUT per student.
 */

type AttendanceEntry = { studentId: string; status: "Present" | "Absent" };
type MarksEntry = { studentId: string; marks: number };

function parseEntries<T>(raw: string | null): T[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

async function loadSubject(subjectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("subjects")
    .select("id, class_id, school_id, name")
    .eq("id", subjectId)
    .maybeSingle();

  return data;
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function saveSubjectAttendanceAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireStaffWithTenant();

  const subjectId = readString(formData, "subjectId");
  const date = readString(formData, "date");
  const entries = parseEntries<AttendanceEntry>(readString(formData, "entries"));

  if (!subjectId || !date) {
    return fail("Subject and date are required.");
  }

  if (!entries || entries.length === 0) {
    return fail("Select at least one student.");
  }

  const subject = await loadSubject(subjectId);

  if (!subject) {
    return fail("That subject no longer exists.");
  }

  const invalid = entries.find(
    (entry) =>
      typeof entry.studentId !== "string" ||
      (entry.status !== "Present" && entry.status !== "Absent"),
  );

  if (invalid) {
    return fail("Attendance data was malformed. Please reload and try again.");
  }

  const supabase = await createSupabaseServerClient();

  const rows = entries.map((entry) => ({
    school_id: subject.school_id,
    student_id: entry.studentId,
    subject_id: subject.id,
    class_id: subject.class_id,
    date,
    status: entry.status,
    recorded_by: user.id,
  }));

  // Upsert, so re-submitting a day corrects it instead of failing on the
  // unique (student, subject, date) constraint.
  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "student_id,subject_id,date" });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/teacher/attendance");
  revalidatePath(`/admin/subjects/${subjectId}`);
  return succeed;
}

/** Removes every attendance row for a subject (all dates). */
export async function clearSubjectAttendanceAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireStaffWithTenant();

  const subjectId = readString(formData, "subjectId");

  if (!subjectId) {
    return fail("Missing subject.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("attendance").delete().eq("subject_id", subjectId);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(`/admin/subjects/${subjectId}`);
  return succeed;
}

/** Removes one student's attendance for one subject. */
export async function removeStudentSubjectAttendanceAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireStaffWithTenant();

  const studentId = readString(formData, "studentId");
  const subjectId = readString(formData, "subjectId");

  if (!studentId || !subjectId) {
    return fail("Missing student or subject.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("student_id", studentId)
    .eq("subject_id", subjectId);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(`/admin/students/${studentId}`);
  return succeed;
}

// ---------------------------------------------------------------------------
// Exam marks
// ---------------------------------------------------------------------------

export async function saveSubjectMarksAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireStaffWithTenant();

  const subjectId = readString(formData, "subjectId");
  const entries = parseEntries<MarksEntry>(readString(formData, "entries"));

  if (!subjectId) {
    return fail("Missing subject.");
  }

  if (!entries || entries.length === 0) {
    return fail("Enter marks for at least one student.");
  }

  const subject = await loadSubject(subjectId);

  if (!subject) {
    return fail("That subject no longer exists.");
  }

  const invalid = entries.find(
    (entry) => typeof entry.studentId !== "string" || !Number.isFinite(entry.marks) || entry.marks < 0,
  );

  if (invalid) {
    return fail("Marks must be zero or a positive number.");
  }

  const supabase = await createSupabaseServerClient();

  const rows = entries.map((entry) => ({
    school_id: subject.school_id,
    student_id: entry.studentId,
    subject_id: subject.id,
    marks_obtained: entry.marks,
  }));

  const { error } = await supabase
    .from("exam_results")
    .upsert(rows, { onConflict: "student_id,subject_id" });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/exam-marks");
  revalidatePath("/teacher/exam-marks");
  revalidatePath(`/admin/subjects/${subjectId}`);
  return succeed;
}

/** Removes every mark row for a subject. */
export async function clearSubjectMarksAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireStaffWithTenant();

  const subjectId = readString(formData, "subjectId");

  if (!subjectId) {
    return fail("Missing subject.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("exam_results").delete().eq("subject_id", subjectId);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(`/admin/subjects/${subjectId}`);
  return succeed;
}

// ---------------------------------------------------------------------------
// Reads exposed as actions
// ---------------------------------------------------------------------------
// The marking screens need existing values for a subject the user has just
// picked, which only becomes known in the browser. A Server Action is the
// right tool: the client can call it with the selection and get plain data
// back, without exposing the table or needing a route handler.
//
// Both are still subject to RLS, so a teacher can only read attendance and
// marks for subjects they actually teach.

export type ExistingAttendance = { studentId: string; status: "Present" | "Absent" };

export async function fetchSubjectAttendanceAction(
  subjectId: string,
  date: string,
): Promise<ExistingAttendance[]> {
  await requireStaffWithTenant();

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("attendance")
    .select("student_id, status")
    .eq("subject_id", subjectId)
    .eq("date", date);

  return (data ?? []).map((row) => ({ studentId: row.student_id, status: row.status }));
}

export type ExistingMarks = { studentId: string; marks: number };

export async function fetchSubjectMarksAction(subjectId: string): Promise<ExistingMarks[]> {
  await requireStaffWithTenant();

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("exam_results")
    .select("student_id, marks_obtained")
    .eq("subject_id", subjectId);

  return (data ?? []).map((row) => ({ studentId: row.student_id, marks: row.marks_obtained }));
}
