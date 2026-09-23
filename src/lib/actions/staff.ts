"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRoleWithTenant } from "@/lib/auth/session";
import {
  createManagedUser,
  deleteManagedUser,
  setManagedUserPassword,
  updateManagedUserName,
} from "@/lib/auth/manage-users";
import { describeThrown, fail, readString, succeed, type FormActionResult } from "@/lib/actions/result";

/**
 * Server actions for the two non-teaching staff roles: the accountant and the
 * schedule officer.
 *
 * These are kept apart from `roster.ts` because they provision an account and
 * nothing else - an accountant has no class, no roll number and no subject to
 * be attached to, so there is no follow-up row to write. `createManagedUser`
 * already writes both halves (the auth user and its `profiles` row) and
 * compensates by deleting the auth user if the profile insert fails.
 *
 * Every action re-checks for the admin role even though RLS would refuse the
 * write anyway: RLS is the security boundary, and this check exists so a
 * wrong-role caller gets a clear message instead of an opaque permission
 * error. Minting a staff account is deliberately admin-only - neither new role
 * may create the other, or itself.
 */

/** The roles this module may provision. Anything else is refused. */
type OfficeRole = "accountant" | "schedule_officer";

function isOfficeRole(value: unknown): value is OfficeRole {
  return value === "accountant" || value === "schedule_officer";
}

export async function createOfficeStaffAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const fullName = readString(formData, "fullName");
  const email = readString(formData, "email")?.toLowerCase() ?? null;
  const password = readString(formData, "password");
  const role = formData.get("role");

  if (!fullName || !email || !password) {
    return fail("Name, email and password are all required.");
  }

  if (!isOfficeRole(role)) {
    return fail("Choose whether this is an Accountant or a Schedule Officer account.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Please enter a valid email address.");
  }

  if (password.length < 8) {
    return fail("Password must be at least 8 characters.");
  }

  try {
    await createManagedUser({
      email,
      password,
      fullName,
      // `role` is narrowed by `isOfficeRole` above, so this cannot be an
      // arbitrary value posted by the browser.
      role,
      schoolId: user.schoolId,
    });
  } catch (error) {
    const message = describeThrown(error);

    if (message.toLowerCase().includes("already")) {
      return fail("An account with that email address already exists.");
    }

    return fail(message);
  }

  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

/**
 * Renames a staff member and, optionally, resets their password.
 *
 * The role is never editable: changing an account's role is a privilege change,
 * and `profiles` has a policy that pins `role` to the caller's own for exactly
 * that reason. A wrong role is fixed by deleting the account and creating the
 * right one.
 */
export async function updateOfficeStaffAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const staffId = readString(formData, "staffId");
  const fullName = readString(formData, "fullName");
  const newPassword = readString(formData, "password");

  if (!staffId || !fullName) {
    return fail("Name is required.");
  }

  try {
    await updateManagedUserName(staffId, fullName);

    if (newPassword) {
      if (newPassword.length < 8) {
        return fail("Password must be at least 8 characters.");
      }

      await setManagedUserPassword(staffId, newPassword);
    }
  } catch (error) {
    return fail(describeThrown(error));
  }

  revalidatePath("/admin/staff");
  return succeed;
}

export async function deleteOfficeStaffAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const staffId = readString(formData, "staffId");

  if (!staffId) {
    return fail("Missing staff member.");
  }

  try {
    // profiles.id and everything hanging off it cascade from auth.users, so
    // this is the single place a staff member is removed. Note that it does
    // NOT revoke an access token already issued - that stays valid until it
    // expires, which the default one-hour JWT lifetime bounds.
    await deleteManagedUser(staffId);
  } catch (error) {
    return fail(describeThrown(error));
  }

  revalidatePath("/admin/staff");
  return succeed;
}
