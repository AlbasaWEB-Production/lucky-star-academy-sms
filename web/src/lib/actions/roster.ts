"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRoleWithTenant } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createStudentUser, createManagedUser, deleteManagedUser, setManagedUserPassword, updateManagedUserName } from "@/lib/auth/manage-users";
import { schoolSlugOrThrow } from "@/lib/data/school";
import { studentLoginEmail } from "@/lib/auth/student-email";
import {
  describeDatabaseError,
  describeThrown,
  fail,
  readInt,
  readNumber,
  readString,
  succeed,
  type FormActionResult,
} from "@/lib/actions/result";

/**
 * Server actions for the school roster: classes, subjects, students, teachers.
 *
 * Every action re-checks the caller's role with `requireRoleWithTenant` even
 * though RLS would refuse the write anyway. The duplication is intentional:
 * RLS is the security boundary, and this check exists so a wrong-role caller
 * gets a clear message instead of an opaque permission error.
 */

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export async function createClassAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");
  const name = readString(formData, "className");

  if (!name) {
    return fail("Class name is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("classes")
    .insert({ name, school_id: user.schoolId });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function updateClassAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const id = readString(formData, "classId");
  const name = readString(formData, "className");

  if (!id || !name) {
    return fail("Class name is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("classes").update({ name }).eq("id", id);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

export async function deleteClassAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const id = readString(formData, "classId");

  if (!id) {
    return fail("Missing class.");
  }

  const supabase = await createSupabaseServerClient();

  // `students.class_id` uses ON DELETE RESTRICT, so the database would reject
  // this anyway. Checking first lets the admin be told exactly how many
  // students are in the way.
  const { count } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("class_id", id);

  if ((count ?? 0) > 0) {
    return fail(
      `This class still has ${count} student${count === 1 ? "" : "s"}. Remove or reassign them before deleting the class.`,
    );
  }

  const { error } = await supabase.from("classes").delete().eq("id", id);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/classes");
  return succeed;
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

export async function createSubjectAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const name = readString(formData, "subjectName");
  const code = readString(formData, "subjectCode");
  const sessions = readString(formData, "sessions");
  const classId = readString(formData, "classId");
  const teacherId = readString(formData, "teacherId");

  if (!name || !code || !sessions || !classId) {
    return fail("Subject name, code, sessions and class are all required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("subjects").insert({
    school_id: user.schoolId,
    class_id: classId,
    name,
    code,
    sessions,
    teacher_id: teacherId,
  });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/subjects");
  redirect("/admin/subjects");
}

export async function updateSubjectAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const id = readString(formData, "subjectId");
  const name = readString(formData, "subjectName");
  const code = readString(formData, "subjectCode");
  const sessions = readString(formData, "sessions");
  const classId = readString(formData, "classId");
  const teacherId = readString(formData, "teacherId");

  if (!id || !name || !code || !sessions || !classId) {
    return fail("Subject name, code, sessions and class are all required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("subjects")
    .update({ name, code, sessions, class_id: classId, teacher_id: teacherId })
    .eq("id", id);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/subjects");
  redirect("/admin/subjects");
}

export async function deleteSubjectAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const id = readString(formData, "subjectId");

  if (!id) {
    return fail("Missing subject.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/subjects");
  return succeed;
}

/** Assigns (or clears) the teacher for one subject. */
export async function assignTeacherAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const subjectId = readString(formData, "subjectId");
  const teacherId = readString(formData, "teacherId");

  if (!subjectId) {
    return fail("Missing subject.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("subjects")
    .update({ teacher_id: teacherId })
    .eq("id", subjectId);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/teachers");
  revalidatePath("/admin/subjects");
  return succeed;
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export async function createStudentAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const fullName = readString(formData, "fullName");
  const rollNumber = readInt(formData, "rollNumber");
  const classId = readString(formData, "classId");
  const password = readString(formData, "password");

  if (!fullName || rollNumber === null || !classId || !password) {
    return fail("Name, roll number, class and password are all required.");
  }

  if (rollNumber <= 0) {
    return fail("Roll number must be a positive whole number.");
  }

  if (password.length < 8) {
    return fail("Password must be at least 8 characters.");
  }

  try {
    const slug = await schoolSlugOrThrow(user.schoolId);

    await createStudentUser({
      email: studentLoginEmail(slug, rollNumber),
      password,
      fullName,
      schoolId: user.schoolId,
      classId,
      rollNumber,
    });
  } catch (error) {
    const message = describeThrown(error);

    if (message.includes("already")) {
      return fail("That roll number or email address is already in use.");
    }

    return fail(message);
  }

  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function updateStudentAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const studentId = readString(formData, "studentId");
  const fullName = readString(formData, "fullName");
  const rollNumber = readInt(formData, "rollNumber");
  const classId = readString(formData, "classId");
  const newPassword = readString(formData, "password");

  if (!studentId || !fullName || rollNumber === null || !classId) {
    return fail("Name, roll number and class are all required.");
  }

  const supabase = await createSupabaseServerClient();

  const { error: studentError } = await supabase
    .from("students")
    .update({ class_id: classId, roll_number: rollNumber })
    .eq("id", studentId);

  if (studentError) {
    return fail(describeDatabaseError(studentError));
  }

  try {
    await updateManagedUserName(studentId, fullName);

    if (newPassword) {
      if (newPassword.length < 8) {
        return fail("Password must be at least 8 characters.");
      }
      await setManagedUserPassword(studentId, newPassword);
    }
  } catch (error) {
    return fail(describeThrown(error));
  }

  // The synthetic login address embeds the roll number, so it has to follow
  // the student's new roll number or they would no longer be able to sign in.
  try {
    const slug = await schoolSlugOrThrow(user.schoolId);
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(studentId, {
      email: studentLoginEmail(slug, rollNumber),
      email_confirm: true,
    });

    if (error) {
      return fail(`Details saved, but the login address could not be updated: ${error.message}`);
    }
  } catch (error) {
    return fail(describeThrown(error));
  }

  revalidatePath("/admin/students");
  redirect(`/admin/students/${studentId}`);
}

export async function deleteStudentAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const studentId = readString(formData, "studentId");

  if (!studentId) {
    return fail("Missing student.");
  }

  try {
    await deleteManagedUser(studentId);
  } catch (error) {
    return fail(describeThrown(error));
  }

  revalidatePath("/admin/students");
  return succeed;
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

export async function createTeacherAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const fullName = readString(formData, "fullName");
  const email = readString(formData, "email")?.toLowerCase() ?? null;
  const password = readString(formData, "password");
  const subjectId = readString(formData, "subjectId");

  if (!fullName || !email || !password) {
    return fail("Name, email and password are all required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Please enter a valid email address.");
  }

  if (password.length < 8) {
    return fail("Password must be at least 8 characters.");
  }

  let teacherId: string;

  try {
    teacherId = await createManagedUser({
      email,
      password,
      fullName,
      role: "teacher",
      schoolId: user.schoolId,
    });
  } catch (error) {
    const message = describeThrown(error);

    if (message.toLowerCase().includes("already")) {
      return fail("An account with that email address already exists.");
    }

    return fail(message);
  }

  // Optional: assign the new teacher to a subject straight away. In the old
  // schema the link lived on the teacher document; here the subject holds it.
  if (subjectId) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("subjects")
      .update({ teacher_id: teacherId })
      .eq("id", subjectId);

    if (error) {
      return fail(
        `Teacher created, but assigning the subject failed: ${describeDatabaseError(error)}`,
      );
    }
  }

  revalidatePath("/admin/teachers");
  redirect("/admin/teachers");
}

export async function updateTeacherAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const teacherId = readString(formData, "teacherId");
  const fullName = readString(formData, "fullName");
  const newPassword = readString(formData, "password");

  if (!teacherId || !fullName) {
    return fail("Name is required.");
  }

  try {
    await updateManagedUserName(teacherId, fullName);

    if (newPassword) {
      if (newPassword.length < 8) {
        return fail("Password must be at least 8 characters.");
      }
      await setManagedUserPassword(teacherId, newPassword);
    }
  } catch (error) {
    return fail(describeThrown(error));
  }

  revalidatePath("/admin/teachers");
  redirect(`/admin/teachers/${teacherId}`);
}

export async function deleteTeacherAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const teacherId = readString(formData, "teacherId");

  if (!teacherId) {
    return fail("Missing teacher.");
  }

  try {
    // subjects.teacher_id is ON DELETE SET NULL, so the subject survives and
    // simply becomes unassigned.
    await deleteManagedUser(teacherId);
  } catch (error) {
    return fail(describeThrown(error));
  }

  revalidatePath("/admin/teachers");
  return succeed;
}

/** Records the admin's teacher attendance entry for a date. */
export async function saveTeacherAttendanceAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const teacherId = readString(formData, "teacherId");
  const date = readString(formData, "date");
  const presentCount = readNumber(formData, "presentCount");
  const absentCount = readNumber(formData, "absentCount");

  if (!teacherId || !date) {
    return fail("Teacher and date are required.");
  }

  if (presentCount === null || absentCount === null) {
    return fail("Present and absent counts must be numbers.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("teacher_attendance").upsert(
    {
      school_id: user.schoolId,
      teacher_id: teacherId,
      date,
      present_count: presentCount,
      absent_count: absentCount,
    },
    { onConflict: "teacher_id,date" },
  );

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(`/admin/teachers/${teacherId}`);
  return succeed;
}
