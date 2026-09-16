import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Finance read layer.
 *
 * Same contract as `queries.ts` / `dashboard.ts`: no `where school_id = ...`,
 * no role check. Every read is scoped by Row Level Security on the table or the
 * `security_invoker` view underneath, so an admin sees the whole school, a
 * teacher sees only the classes they teach, and a pupil sees only their own
 * assessments and payments. If a finance screen shows the wrong rows, the
 * policy in `20260101000400_analytics_fees.sql` is what to fix - not this file.
 *
 * Every amount is integer pesewas and is left in pesewas here; the caller
 * renders money through `@/lib/money`, never by dividing by 100 by hand.
 *
 * As in `dashboard.ts`, PostgREST serialises `numeric` / `bigint` as JSON
 * strings, so every rate, average and count is coerced with `Number()`.
 */

// ---------------------------------------------------------------------------
// View models (camelCased; pesewas kept as integers)
// ---------------------------------------------------------------------------

export type FeeStructureRow = {
  id: string;
  classId: string;
  className: string;
  termId: string;
  termName: string;
  description: string;
  amountPesewas: number;
  dueDate: string | null;
};

export type FeeAssessmentRow = {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: number;
  classId: string;
  className: string;
  termId: string;
  termName: string;
  amountPesewas: number;
  dueDate: string | null;
  paidPesewas: number;
  balancePesewas: number;
};

export type PaymentRow = {
  id: string;
  amountPesewas: number;
  paymentDate: string;
  method: string;
  receiptNumber: number;
  isReversal: boolean;
  reversalReason: string | null;
  reversesPaymentId: string | null;
};

export type FeeStatusByStudentRow = {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  campus: string | null;
  termId: string;
  amountDuePesewas: number;
  paidPesewas: number;
  balancePesewas: number;
  dueDate: string | null;
};

export type FeesCollectedVsExpectedRow = {
  termId: string;
  termName: string;
  startDate: string | null;
  expectedPesewas: number;
  collectedPesewas: number;
  collectionRate: number | null;
  avgDaysToPay: number | null;
};

export type OutstandingByClassRow = {
  classId: string;
  className: string;
  campus: string | null;
  termId: string;
  termName: string;
  expectedPesewas: number;
  collectedPesewas: number;
  outstandingPesewas: number;
  pupilsWithAssessment: number;
};

export type BudgetVsActualRow = {
  termId: string;
  termName: string;
  costCentre: string;
  budgetPesewas: number;
  actualPesewas: number;
  variancePesewas: number;
};

export type CashPositionRow = {
  /** First day of the month, as `YYYY-MM-DD`. */
  month: string;
  incomePesewas: number;
  expensesPesewas: number;
  netPesewas: number;
  runningBalancePesewas: number;
};

export type BudgetLineRow = {
  id: string;
  termId: string;
  termName: string;
  costCentre: string;
  description: string | null;
  budgetPesewas: number;
};

export type ExpenseRow = {
  id: string;
  termId: string;
  termName: string;
  costCentre: string;
  description: string;
  amountPesewas: number;
  expenseDate: string;
};

// ---------------------------------------------------------------------------
// Name lookups
// ---------------------------------------------------------------------------

/** `className` by id; empty map when the caller cannot read any class. */
async function classNames(): Promise<Map<string, string>> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("classes").select("id, name");
  return new Map((data ?? []).map((row) => [row.id, row.name]));
}

/** `termName` by id; empty map when the caller cannot read any term. */
async function termNames(): Promise<Map<string, string>> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("terms").select("id, name");
  return new Map((data ?? []).map((row) => [row.id, row.name]));
}

// ---------------------------------------------------------------------------
// Fee structures
// ---------------------------------------------------------------------------

export async function listFeeStructures(): Promise<FeeStructureRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("fee_structures")
    .select("id, class_id, term_id, description, amount, due_date")
    .order("term_id")
    .order("class_id");

  const [classes, terms] = await Promise.all([classNames(), termNames()]);

  return (data ?? []).map((row) => ({
    id: row.id,
    classId: row.class_id,
    className: classes.get(row.class_id) ?? "Class",
    termId: row.term_id,
    termName: terms.get(row.term_id) ?? "Term",
    description: row.description,
    amountPesewas: Number(row.amount),
    dueDate: row.due_date,
  }));
}

// ---------------------------------------------------------------------------
// Assessments and payments
// ---------------------------------------------------------------------------

/**
 * Assessments for one term, each with its running balance from payments.
 *
 * `termId` is required because the fee-status screen always names a term; a
 * blank chart is better than a chart that silently mixes terms. A teacher gets
 * only the assessments in classes they teach (RLS); a pupil only their own.
 */
export async function listFeeAssessmentsForTerm(termId: string): Promise<FeeAssessmentRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("fee_assessments")
    .select("id, student_id, class_id, term_id, amount, due_date")
    .eq("term_id", termId)
    .order("student_id");

  const [students, classes, terms] = await Promise.all([studentNames(), classNames(), termNames()]);

  // Balances from payments, fetched in one batched query over the term's
  // assessments rather than an embedded select (the data layer avoids those).
  const ids = (data ?? []).map((row) => row.id);
  const paidByAssessment = new Map<string, number>();
  if (ids.length > 0) {
    const { data: payments } = await supabase
      .from("fee_payments")
      .select("assessment_id, amount, is_reversal")
      .in("assessment_id", ids);
    for (const p of payments ?? []) {
      const sign = p.is_reversal ? -1 : 1;
      paidByAssessment.set(
        p.assessment_id,
        (paidByAssessment.get(p.assessment_id) ?? 0) + sign * Number(p.amount),
      );
    }
  }

  return (data ?? []).map((row) => {
    const paid = paidByAssessment.get(row.id) ?? 0;
    return {
      id: row.id,
      studentId: row.student_id,
      studentName: students.get(row.student_id)?.name ?? "Pupil",
      rollNumber: students.get(row.student_id)?.rollNumber ?? 0,
      classId: row.class_id,
      className: classes.get(row.class_id) ?? "Class",
      termId: row.term_id,
      termName: terms.get(row.term_id) ?? "Term",
      amountPesewas: Number(row.amount),
      dueDate: row.due_date,
      paidPesewas: paid,
      balancePesewas: Number(row.amount) - paid,
    };
  });
}

/** Payments against one assessment, newest first, so a receipt shows the full history. */
export async function listPaymentsForAssessment(assessmentId: string): Promise<PaymentRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("fee_payments")
    .select(
      "id, amount, payment_date, method, receipt_number, is_reversal, reversal_reason, reverses_payment_id",
    )
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    amountPesewas: Number(row.amount),
    paymentDate: row.payment_date,
    method: row.method,
    receiptNumber: Number(row.receipt_number),
    isReversal: row.is_reversal,
    reversalReason: row.reversal_reason,
    reversesPaymentId: row.reverses_payment_id,
  }));
}

/**
 * A pupil's own finance summary: one entry per assessment with its payments.
 * RLS keeps this to the signed-in pupil's own rows, so no school filter and no
 * role check reach the query.
 */
export async function listOwnFinance(): Promise<
  Array<{
    termId: string;
    termName: string;
    assessmentId: string;
    amountPesewas: number;
    paidPesewas: number;
    balancePesewas: number;
    dueDate: string | null;
    payments: PaymentRow[];
  }>
> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("fee_assessments")
    .select("id, term_id, amount, due_date")
    .order("term_id");

  const terms = await termNames();

  // Payments for the pupil's own assessments, fetched in one batched query
  // (the data layer avoids embedded selects).
  const ids = (data ?? []).map((row) => row.id);
  const paymentsById = new Map<string, PaymentRow[]>();
  if (ids.length > 0) {
    const { data: rows } = await supabase
      .from("fee_payments")
      .select(
        "id, assessment_id, amount, payment_date, method, receipt_number, is_reversal, reversal_reason, reverses_payment_id",
      )
      .in("assessment_id", ids)
      .order("created_at", { ascending: false });
    for (const p of rows ?? []) {
      const list = paymentsById.get(p.assessment_id) ?? [];
      list.push({
        id: p.id,
        amountPesewas: Number(p.amount),
        paymentDate: p.payment_date,
        method: p.method,
        receiptNumber: Number(p.receipt_number),
        isReversal: p.is_reversal,
        reversalReason: p.reversal_reason,
        reversesPaymentId: p.reverses_payment_id,
      });
      paymentsById.set(p.assessment_id, list);
    }
  }

  return (data ?? []).map((row) => {
    const payments = paymentsById.get(row.id) ?? [];
    const paid = payments.reduce(
      (total, p) => total + (p.isReversal ? -p.amountPesewas : p.amountPesewas),
      0,
    );
    return {
      termId: row.term_id,
      termName: terms.get(row.term_id) ?? "Term",
      assessmentId: row.id,
      amountPesewas: Number(row.amount),
      paidPesewas: paid,
      balancePesewas: Number(row.amount) - paid,
      dueDate: row.due_date,
      payments,
    };
  });
}

// ---------------------------------------------------------------------------
// Aggregated views (admin/teacher; role-scoped by the view itself)
// ---------------------------------------------------------------------------

/**
 * Amount due, paid and balance per pupil for a term. Admin sees every pupil;
 * a teacher sees only the classes they teach (the view inherits RLS on
 * `fee_assessments`). A pupil is never handed this rows - the view only emits
 * for `jwt_role() in ('admin','teacher')`.
 */
export async function listFeeStatusByStudent(termId: string): Promise<FeeStatusByStudentRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_fee_status_by_student")
    .select(
      "student_id, student_name, class_id, class_name, campus, term_id, amount_due, paid, balance, due_date",
    )
    .eq("term_id", termId)
    .order("student_name");

  return (data ?? []).map((row) => ({
    studentId: row.student_id,
    studentName: row.student_name,
    classId: row.class_id,
    className: row.class_name,
    campus: row.campus,
    termId: row.term_id,
    amountDuePesewas: Number(row.amount_due),
    paidPesewas: Number(row.paid),
    balancePesewas: Number(row.balance),
    dueDate: row.due_date,
  }));
}

/** Fees collected vs expected per term, for the collected-vs-expected chart. */
export async function listFeesCollectedVsExpected(): Promise<FeesCollectedVsExpectedRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_fees_collected_vs_expected")
    .select("term_id, term_name, start_date, expected_pesewas, collected_pesewas, collection_rate, avg_days_to_pay")
    .order("start_date");

  return (data ?? []).map((row) => ({
    termId: row.term_id,
    termName: row.term_name,
    startDate: row.start_date,
    expectedPesewas: Number(row.expected_pesewas),
    collectedPesewas: Number(row.collected_pesewas),
    collectionRate: row.collection_rate === null ? null : Number(row.collection_rate),
    avgDaysToPay: row.avg_days_to_pay === null ? null : Number(row.avg_days_to_pay),
  }));
}

/** Outstanding fees by class, for the composition chart. */
export async function listOutstandingByClass(): Promise<OutstandingByClassRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_outstanding_by_class")
    .select(
      "class_id, class_name, campus, term_id, term_name, expected_pesewas, collected_pesewas, outstanding_pesewas, pupils_with_assessment",
    )
    .order("term_name")
    .order("class_name");

  return (data ?? []).map((row) => ({
    classId: row.class_id,
    className: row.class_name,
    campus: row.campus,
    termId: row.term_id,
    termName: row.term_name,
    expectedPesewas: Number(row.expected_pesewas),
    collectedPesewas: Number(row.collected_pesewas),
    outstandingPesewas: Number(row.outstanding_pesewas),
    pupilsWithAssessment: Number(row.pupils_with_assessment),
  }));
}

/** Budget vs actual per cost centre, for the variance chart. */
export async function listBudgetVsActual(): Promise<BudgetVsActualRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_budget_vs_actual")
    .select("term_id, term_name, cost_centre, budget_pesewas, actual_pesewas, variance_pesewas")
    .order("term_name")
    .order("cost_centre");

  return (data ?? []).map((row) => ({
    termId: row.term_id,
    termName: row.term_name,
    costCentre: row.cost_centre,
    budgetPesewas: Number(row.budget_pesewas),
    actualPesewas: Number(row.actual_pesewas),
    variancePesewas: Number(row.variance_pesewas),
  }));
}

/** Monthly cash position, for the running-balance chart. */
export async function listCashPosition(): Promise<CashPositionRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("v_cash_position")
    .select("month, income_pesewas, expenses_pesewas, net_pesewas, running_balance_pesewas")
    .order("month");

  return (data ?? []).map((row) => ({
    month: row.month,
    incomePesewas: Number(row.income_pesewas),
    expensesPesewas: Number(row.expenses_pesewas),
    netPesewas: Number(row.net_pesewas),
    runningBalancePesewas: Number(row.running_balance_pesewas),
  }));
}

// ---------------------------------------------------------------------------
// Budget lines and expenses (admin only via RLS)
// ---------------------------------------------------------------------------

export async function listBudgetLines(): Promise<BudgetLineRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("budget_lines")
    .select("id, term_id, cost_centre, description, budget_amount")
    .order("term_id")
    .order("cost_centre");

  const terms = await termNames();

  return (data ?? []).map((row) => ({
    id: row.id,
    termId: row.term_id,
    termName: terms.get(row.term_id) ?? "Term",
    costCentre: row.cost_centre,
    description: row.description,
    budgetPesewas: Number(row.budget_amount),
  }));
}

export async function listExpenses(): Promise<ExpenseRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("expenses")
    .select("id, term_id, cost_centre, description, amount, expense_date")
    .order("expense_date", { ascending: false });

  const terms = await termNames();

  return (data ?? []).map((row) => ({
    id: row.id,
    termId: row.term_id,
    termName: terms.get(row.term_id) ?? "Term",
    costCentre: row.cost_centre,
    description: row.description,
    amountPesewas: Number(row.amount),
    expenseDate: row.expense_date,
  }));
}

// ---------------------------------------------------------------------------
// Pupil/student name lookup
// ---------------------------------------------------------------------------

/** `{ name, rollNumber }` by `students.id`; empty map when no row is readable. */
async function studentNames(): Promise<Map<string, { name: string; rollNumber: number }>> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("student_directory")
    .select("student_id, full_name, roll_number");
  return new Map(
    (data ?? []).map((row) => [
      row.student_id,
      { name: row.full_name, rollNumber: Number(row.roll_number) },
    ]),
  );
}
