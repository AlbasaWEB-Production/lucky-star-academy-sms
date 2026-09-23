"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient, setUserAppMetadata } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { EMAIL_SIGN_IN_ROLES, roleHome, roleLabel, isUserRole } from "./roles";
import { slugifySchoolName, studentLoginEmail, suffixedSlug } from "./student-email";
import type { AuthFormState } from "./form-state";

/**
 * Authentication server actions.
 *
 * Every credential check happens here, on the server. The browser never sees
 * a password hash, a secret key, or a role it gets to assert - the signed-in
 * user's role is read back from app_metadata, which only this server can
 * write.
 *
 * A note on `redirect()`: it works by throwing a control-flow signal, so it is
 * always called last and never inside a try/catch, which would swallow it.
 */

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const MIN_PASSWORD_LENGTH = 8;

/**
 * Sign-in for every role identified by email - admins, teachers, the
 * accountant and the schedule officer. Only students use the roll-number form.
 */
export async function signInWithEmailAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const expectedRole = formData.get("role");

  if (!isUserRole(expectedRole) || !EMAIL_SIGN_IN_ROLES.includes(expectedRole)) {
    return { error: "Unsupported sign-in form." };
  }

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // One generic message for both "no such user" and "wrong password", so the
  // form cannot be used to enumerate which addresses have accounts.
  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  const actualRole = (data.user.app_metadata as Record<string, unknown> | undefined)?.role;

  // The form the user submitted decides which dashboard opens, so a valid
  // account signed in through the wrong form is rejected rather than silently
  // granted that dashboard.
  if (actualRole !== expectedRole) {
    await supabase.auth.signOut();
    return { error: `That account is not registered as a ${roleLabel[expectedRole]}.` };
  }

  redirect(roleHome[expectedRole]);
}

/**
 * Sign-in for students, who are identified by roll number and name.
 *
 * The lookup runs with the secret key because it happens before a session
 * exists, and `students` grants nothing to anon. Only the resolved email is
 * used - no student data is returned to the caller on failure, and the
 * response for "no match" is identical to the response for "wrong password".
 */
export async function signInAsStudentAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const rawRollNumber = String(formData.get("rollNumber") ?? "").trim();
  const studentName = String(formData.get("studentName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!rawRollNumber || !studentName || !password) {
    return { error: "Roll number, name and password are required." };
  }

  const rollNumber = Number(rawRollNumber);

  if (!Number.isInteger(rollNumber) || rollNumber <= 0) {
    return { error: "Roll number must be a positive whole number." };
  }

  if (!isSupabaseAdminConfigured()) {
    return { error: "Supabase is not configured yet. See .env.example." };
  }

  const admin = createSupabaseAdminClient();

  // Filter on roll_number only, then compare the name in JS. Using an ILIKE
  // pattern here would let a student's input act as a wildcard.
  const { data: candidates, error: lookupError } = await admin
    .from("student_directory")
    .select("student_id, school_slug, roll_number, full_name")
    .eq("roll_number", rollNumber);

  if (lookupError) {
    return { error: "Could not reach the student directory. Please try again." };
  }

  const matches = (candidates ?? []).filter(
    (row) => row.full_name.trim().toLowerCase() === studentName.toLowerCase(),
  );

  if (matches.length === 0) {
    return { error: "Invalid roll number, name or password." };
  }

  if (matches.length > 1) {
    // Roll numbers are unique per school, so this means two schools have a
    // student with the same roll number and name.
    return {
      error: "More than one student matches. Please ask your school office to check your details.",
    };
  }

  const match = matches[0];
  const email = studentLoginEmail(match.school_slug, match.roll_number);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Invalid roll number, name or password." };
  }

  const actualRole = (data.user.app_metadata as Record<string, unknown> | undefined)?.role;

  if (actualRole !== "student") {
    await supabase.auth.signOut();
    return { error: "That account is not a student account." };
  }

  redirect(roleHome.student);
}

/**
 * Registers a new school and its first admin.
 *
 * Steps are ordered so that a failure at any point can be compensated for.
 * The auth user is created first because `schools.created_by` and
 * `profiles.id` both reference it, and `app_metadata.school_id` can only be
 * written once the school row exists.
 */
export async function registerSchoolAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const schoolName = String(formData.get("schoolName") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!schoolName || !adminName || !email || !password) {
    return { error: "All fields are required." };
  }

  if (!looksLikeEmail(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  if (password !== confirmPassword) {
    return { error: "The two passwords do not match." };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      error:
        "Server-side Supabase keys are missing, so accounts cannot be created. " +
        "Add SUPABASE_SECRET_KEY to .env.local.",
    };
  }

  const admin = createSupabaseAdminClient();

  // Find a free slug. The unique constraint on schools.slug is the real
  // guarantee; this loop just avoids failing on a collision.
  const baseSlug = slugifySchoolName(schoolName);
  let slug = "";

  for (let attempt = 1; attempt <= 25; attempt += 1) {
    const candidate = suffixedSlug(baseSlug, attempt);
    const { data: existing } = await admin
      .from("schools")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!existing) {
      slug = candidate;
      break;
    }
  }

  if (!slug) {
    return { error: "Could not generate a unique identifier for that school name." };
  }

  // Step 1: the auth user. school_id is not known yet, so it is set in step 3.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin", full_name: adminName },
  });

  if (createError || !created.user) {
    if (createError?.message?.toLowerCase().includes("already")) {
      return { error: "An account with that email address already exists." };
    }
    return { error: createError?.message ?? "Could not create the administrator account." };
  }

  const userId = created.user.id;

  // Step 2: the school (the tenant).
  const { data: school, error: schoolError } = await admin
    .from("schools")
    .insert({ name: schoolName, slug, created_by: userId })
    .select("id")
    .single();

  if (schoolError || !school) {
    await admin.auth.admin.deleteUser(userId);
    return { error: `Could not create the school: ${schoolError?.message ?? "unknown error"}` };
  }

  const cleanup = async () => {
    await admin.from("schools").delete().eq("id", school.id);
    await admin.auth.admin.deleteUser(userId);
  };

  // Step 3: mirror role and school_id into app_metadata, which is what every
  // RLS policy reads.
  try {
    await setUserAppMetadata(userId, {
      role: "admin",
      school_id: school.id,
      full_name: adminName,
    });
  } catch (error) {
    await cleanup();
    return {
      error: error instanceof Error ? error.message : "Could not initialize the account.",
    };
  }

  // Step 4: the profile row.
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    school_id: school.id,
    role: "admin",
    full_name: adminName,
    email,
  });

  if (profileError) {
    await cleanup();
    return { error: `Could not create the administrator profile: ${profileError.message}` };
  }

  // Step 5: sign in so the freshly written app_metadata is present in the JWT.
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return {
      error: "Your school was created, but automatic sign-in failed. Please sign in manually.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

/** Clears the session and returns to the landing page. */
export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
