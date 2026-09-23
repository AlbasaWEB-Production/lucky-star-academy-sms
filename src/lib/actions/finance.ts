"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireFinanceWithTenant, requireRoleWithTenant } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cedisStringToPesewas } from "@/lib/money";
import {
  describeDatabaseError,
  fail,
  readString,
  succeed,
  type FormActionResult,
} from "@/lib/actions/result";

/**
 * Server actions for fees and finance.
 *
 * Every action re-checks the caller's role even though RLS would refuse the
 * write anyway. Which guard an action uses is the split between keeping the
 * books and setting the school's money policy:
 *
 *  - `requireFinanceWithTenant()` - an administrator **or** the accountant.
 *    These are the three day-to-day operations the finance desk performs:
 *    issuing an assessment (`generateAssessmentsAction`), banking a payment
 *    (`recordPaymentAction`) and recording what was spent
 *    (`createExpenseAction`). The accountant portal mounts exactly these forms,
 *    and `20260101000950_staff_portals.sql` grants the accountant the matching
 *    insert policies.
 *
 *  - `requireRoleWithTenant("admin")` - everything else, because it is a
 *    management control rather than a book-keeping one. Setting what a class is
 *    charged (`createFeeStructureAction` / `deleteFeeStructureAction`), setting
 *    a budget (`createBudgetLineAction`) and reversing money already banked
 *    (`reversePaymentAction`) all change policy or rewrite the audit trail, so
 *    they stay with the head. The accountant can *read* fee structures and
 *    budget lines - comparing spend against the plan is the job - but the
 *    accountant portal deliberately has no page that writes them.
 *
 * A teacher reads fee status through the aggregated view, a pupil reads only
 * their own assessments and payments, and neither writes anything.
 *
 * Each of the three widened actions also revalidates the `/accountant/...`
 * route it writes to, the way it already revalidated the admin one, so a
 * finance screen the accountant is looking at is never left stale.
 *
 * Money arrives from a form as a cedi string ("180.50") and is stored as the
 * integer number of pesewas returned by `cedisStringToPesewas` - the only other
 * place that number 100 appears is `@/lib/money`.
 */

/** Reads a required cedi amount from a form and returns integer pesewas. */
function readPesewas(formData: FormData, key: string): number | null {
  const raw = readString(formData, key);
  if (raw === null) {
    return null;
  }
  return cedisStringToPesewas(raw);
}

// ---------------------------------------------------------------------------
// Fee structures
// ---------------------------------------------------------------------------

export async function createFeeStructureAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const classId = readString(formData, "classId");
  const termId = readString(formData, "termId");
  const description = readString(formData, "description");
  const amountPesewas = readPesewas(formData, "amount");
  const dueDate = readString(formData, "dueDate");

  if (!classId || !termId || !description || amountPesewas === null) {
    return fail("Class, term, description and amount are all required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("fee_structures").insert({
    school_id: user.schoolId,
    class_id: classId,
    term_id: termId,
    description,
    amount: amountPesewas,
    due_date: dueDate,
  });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/fees/structures");
  return succeed;
}

export async function deleteFeeStructureAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireRoleWithTenant("admin");

  const id = readString(formData, "feeStructureId");
  if (!id) {
    return fail("Missing fee structure.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("fee_structures").delete().eq("id", id);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/fees/structures");
  return succeed;
}

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------

/**
 * Generates one `fee_assessment` per student in a class for a term, from the
 * sum of that class's `fee_structures` for the term. Pupils who already have an
 * assessment for the term are left untouched, so re-running the action never
 * duplicates or overwrites.
 */
export async function generateAssessmentsAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  // Admin or accountant: issuing the term's bills is a book-keeping action.
  const user = await requireFinanceWithTenant();

  const classId = readString(formData, "classId");
  const termId = readString(formData, "termId");

  if (!classId || !termId) {
    return fail("Class and term are both required.");
  }

  const supabase = await createSupabaseServerClient();

  // The amount each pupil owes = the sum of this class's fee structures for the
  // term. No structures -> nothing to charge, so say so rather than charging 0.
  const { data: structures } = await supabase
    .from("fee_structures")
    .select("amount")
    .eq("class_id", classId)
    .eq("term_id", termId);

  if (!structures || structures.length === 0) {
    return fail(
      "There are no fee structures for this class and term yet. Add them first, then generate assessments.",
    );
  }
  const totalPesewas = structures.reduce((sum, row) => sum + Number(row.amount), 0);

  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("class_id", classId);

  if (!students || students.length === 0) {
    return fail("This class has no pupils to assess.");
  }

  // Pupils who already have an assessment for the term.
  const { data: existing } = await supabase
    .from("fee_assessments")
    .select("student_id")
    .eq("term_id", termId)
    .eq("class_id", classId);
  const already = new Set((existing ?? []).map((row) => row.student_id));

  const toInsert = students
    .filter((row) => !already.has(row.id))
    .map((row) => ({
      school_id: user.schoolId,
      student_id: row.id,
      class_id: classId,
      term_id: termId,
      amount: totalPesewas,
    }));

  if (toInsert.length === 0) {
    return succeed; // every pupil is already assessed; nothing to do
  }

  const { error } = await supabase.from("fee_assessments").insert(toInsert);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/fees/assessments");
  revalidatePath("/accountant/fees/assessments");
  return succeed;
}

// ---------------------------------------------------------------------------
// Payments and reversals
// ---------------------------------------------------------------------------

export async function recordPaymentAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  // Admin or accountant: banking money is a book-keeping action. Reversing it
  // (below) is not, and stays admin-only.
  const user = await requireFinanceWithTenant();

  const assessmentId = readString(formData, "assessmentId");
  const amountPesewas = readPesewas(formData, "amount");
  const method = readString(formData, "method");
  const paymentDate = readString(formData, "paymentDate");

  if (!assessmentId || amountPesewas === null || method === null) {
    return fail("Amount, method and assessment are all required.");
  }
  if (amountPesewas <= 0) {
    return fail("A payment amount must be greater than zero.");
  }
  if (!["cash", "mobile_money", "bank"].includes(method)) {
    return fail("Please choose a payment method.");
  }

  const supabase = await createSupabaseServerClient();

  // `payment_date` defaults to today in the database; only send it when the
  // admin has chosen a different date, so an empty field never hits a
  // non-nullable column with a null.
  const payment: {
    school_id: string;
    assessment_id: string;
    amount: number;
    method: string;
    created_by: string | null;
    payment_date?: string;
  } = {
    school_id: user.schoolId,
    assessment_id: assessmentId,
    amount: amountPesewas,
    method,
    created_by: user.id,
  };
  if (paymentDate) {
    payment.payment_date = paymentDate;
  }

  const { data, error } = await supabase
    .from("fee_payments")
    .insert(payment)
    .select("id")
    .single();

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/fees/payments");
  revalidatePath("/admin/fees/assessments");
  revalidatePath("/accountant/fees/payments");
  revalidatePath("/accountant/fees/assessments");

  // An admin lands on the receipt for the payment just made. That route exists
  // only under /admin, and src/proxy.ts confines a role to its own subtree, so
  // an accountant sent there would be bounced to their dashboard straight after
  // a successful save - the payment would be banked but never confirmed. They
  // land on their own ledger instead, where the row they just recorded is the
  // newest one. An admin's redirect is unchanged.
  if (user.role === "accountant") {
    redirect("/accountant/fees/payments");
  }

  redirect(`/admin/fees/receipts/${data.id}`);
}

/** Reverses an earlier payment with a compensating record and a reason. */
export async function reversePaymentAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const paymentId = readString(formData, "paymentId");
  const reason = readString(formData, "reversalReason");

  if (!paymentId) {
    return fail("Missing payment.");
  }
  if (!reason || reason.length < 3) {
    return fail("A reason is required to reverse a payment.");
  }

  const supabase = await createSupabaseServerClient();

  const { data: payment } = await supabase
    .from("fee_payments")
    .select("id, school_id, assessment_id, amount, payment_date, method, is_reversal")
    .eq("id", paymentId)
    .single();

  if (!payment) {
    return fail("That payment could not be found.");
  }
  if (payment.is_reversal) {
    return fail("A reversal should not be reversed again.");
  }

  const { error } = await supabase.from("fee_payments").insert({
    school_id: user.schoolId,
    assessment_id: payment.assessment_id,
    amount: Number(payment.amount),
    method: payment.method,
    payment_date: payment.payment_date,
    created_by: user.id,
    is_reversal: true,
    reverses_payment_id: payment.id,
    reversal_reason: reason,
  });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/fees/payments");
  revalidatePath("/admin/fees/assessments");
  return succeed;
}

// ---------------------------------------------------------------------------
// Budget lines and expenses
// ---------------------------------------------------------------------------

export async function createBudgetLineAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireRoleWithTenant("admin");

  const termId = readString(formData, "termId");
  const costCentre = readString(formData, "costCentre");
  const description = readString(formData, "description");
  const budgetPesewas = readPesewas(formData, "budgetAmount");

  if (!termId || !costCentre || budgetPesewas === null) {
    return fail("Term, cost centre and budget amount are all required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("budget_lines").insert({
    school_id: user.schoolId,
    term_id: termId,
    cost_centre: costCentre,
    description,
    budget_amount: budgetPesewas,
  });

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/fees/budget");
  return succeed;
}

export async function createExpenseAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  // Admin or accountant: recording what was spent is a book-keeping action.
  // Setting the budget it is measured against (above) is not.
  const user = await requireFinanceWithTenant();

  const termId = readString(formData, "termId");
  const costCentre = readString(formData, "costCentre");
  const description = readString(formData, "description");
  const amountPesewas = readPesewas(formData, "amount");
  const expenseDate = readString(formData, "expenseDate");

  if (!termId || !costCentre || !description || amountPesewas === null) {
    return fail("Term, cost centre, description and amount are all required.");
  }
  if (amountPesewas <= 0) {
    return fail("An expense amount must be greater than zero.");
  }

  const supabase = await createSupabaseServerClient();

  // `expense_date` defaults to today; only send it when a date is chosen.
  const expense: {
    school_id: string;
    term_id: string;
    cost_centre: string;
    description: string;
    amount: number;
    created_by: string | null;
    expense_date?: string;
  } = {
    school_id: user.schoolId,
    term_id: termId,
    cost_centre: costCentre,
    description,
    amount: amountPesewas,
    created_by: user.id,
  };
  if (expenseDate) {
    expense.expense_date = expenseDate;
  }

  const { error } = await supabase.from("expenses").insert(expense);

  if (error) {
    return fail(describeDatabaseError(error));
  }

  revalidatePath("/admin/fees/expenses");
  revalidatePath("/accountant/fees/expenses");
  return succeed;
}
