import "server-only";

import { createSupabaseAdminClient, setUserAppMetadata } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/database.types";

/**
 * Provisioning helpers for the users a school admin manages.
 *
 * None of this can be done under Row Level Security, and that is by design:
 *
 *   - `auth.users` has no RLS at all, so only the Auth admin API can create
 *     users.
 *   - `app_metadata` is writable only by the Auth admin API - that is exactly
 *     what makes it safe to authorize against.
 *
 * Creating a user is therefore a two-part write (auth user, then the
 * matching public row) which cannot be a single transaction across the two
 * systems. Each helper compensates by deleting the auth user if the follow-up
 * write fails, so a failure cannot leave an account that can sign in but has
 * no profile.
 */

export type CreateManagedUserInput = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  schoolId: string;
};

/**
 * Creates an auth user plus its public.profiles row.
 *
 * `email_confirm: true` is deliberate. A school admin creates teacher and
 * student accounts directly, and a fresh Supabase project has no SMTP
 * provider configured, so requiring confirmation would leave every created
 * account unable to sign in.
 */
export async function createManagedUser(input: CreateManagedUserInput): Promise<string> {
  const admin = createSupabaseAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    app_metadata: {
      role: input.role,
      school_id: input.schoolId,
      full_name: input.fullName,
    },
  });

  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Could not create the user account.");
  }

  const userId = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    school_id: input.schoolId,
    role: input.role,
    full_name: input.fullName,
    email: input.email,
  });

  if (profileError) {
    // Compensate: without a profile the account would sign in and then be
    // immediately rejected as unprovisioned.
    await admin.auth.admin.deleteUser(userId);
    throw new Error(`Could not create the profile: ${profileError.message}`);
  }

  return userId;
}

export type CreateStudentInput = {
  email: string;
  password: string;
  fullName: string;
  schoolId: string;
  classId: string;
  rollNumber: number;
};

/** Creates a student: auth user, profile, and the students row. */
export async function createStudentUser(input: CreateStudentInput): Promise<string> {
  const userId = await createManagedUser({
    email: input.email,
    password: input.password,
    fullName: input.fullName,
    role: "student",
    schoolId: input.schoolId,
  });

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("students").insert({
    id: userId,
    school_id: input.schoolId,
    class_id: input.classId,
    roll_number: input.rollNumber,
  });

  if (error) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error(`Could not enrol the student: ${error.message}`);
  }

  return userId;
}

/**
 * Deletes a user.
 *
 * `profiles.id` and every dependent row cascade from `auth.users`, so this is
 * the single place a school member is removed.
 *
 * Note that deleting a user does NOT revoke an access token that has already
 * been issued; the token stays valid until it expires. Keeping the default
 * one-hour JWT lifetime bounds that window.
 */
export async function deleteManagedUser(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`Could not delete the user: ${error.message}`);
  }
}

/** Changes a user's password on their behalf. */
export async function setManagedUserPassword(userId: string, password: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });

  if (error) {
    throw new Error(`Could not update the password: ${error.message}`);
  }
}

/**
 * Renames a user.
 *
 * The name is written to both places it lives - the profiles row and
 * app_metadata - so the mirrored values cannot drift apart.
 */
export async function updateManagedUserName(userId: string, fullName: string): Promise<void> {
  const admin = createSupabaseAdminClient();

  const { data: profile, error: readError } = await admin
    .from("profiles")
    .select("role, school_id")
    .eq("id", userId)
    .single();

  if (readError || !profile) {
    throw new Error(readError?.message ?? "Profile not found.");
  }

  if (!profile.school_id) {
    throw new Error("Profile has no school; cannot update app_metadata.");
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (updateError) {
    throw new Error(`Could not update the profile: ${updateError.message}`);
  }

  await setUserAppMetadata(userId, {
    role: profile.role,
    school_id: profile.school_id,
    full_name: fullName,
  });
}
