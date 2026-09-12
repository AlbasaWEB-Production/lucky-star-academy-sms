"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  describeDatabaseError,
  fail,
  readString,
  succeed,
  type FormActionResult,
} from "@/lib/actions/result";

/**
 * Lets any signed-in user rename themselves.
 *
 * This is the one profile write that does not need the secret key: the
 * `profiles_update_self` policy permits a user to update their own row, and
 * its WITH CHECK clause pins `role` and `school_id` to the values in their own
 * JWT, so this action cannot be used to become an admin.
 *
 * Email addresses are intentionally not editable here. Changing an email is an
 * identity change that also affects the login, so it belongs with the admin
 * flows that own account provisioning.
 */
export async function updateOwnNameAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireSessionUser();
  const fullName = readString(formData, "fullName");

  if (!fullName) {
    return fail("Your name cannot be empty.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath(`/${user.role}/profile`);
  revalidatePath("/", "layout");
  return succeed;
}
