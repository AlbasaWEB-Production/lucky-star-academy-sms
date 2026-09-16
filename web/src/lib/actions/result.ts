/**
 * Shared helpers for server actions.
 *
 * Kept out of the "use server" modules themselves, because those may only
 * export async functions.
 */

/** State shape used by forms driven by React's `useActionState`. */
export type FormActionResult = {
  error: string | null;
  /** Set after a successful write so the UI can confirm it. */
  ok?: boolean;
};

export const initialFormResult: FormActionResult = { error: null };

export function fail(message: string): FormActionResult {
  return { error: message };
}

export const succeed: FormActionResult = { error: null, ok: true };

/**
 * Turns a Postgres/PostgREST error into something a user can act on.
 *
 * The constraint names come from supabase/migrations/*.sql, so a uniqueness
 * clash can be reported as a real sentence rather than a raw SQL error.
 */
export function describeDatabaseError(error: { code?: string; message: string }): string {
  // 23505 unique_violation
  if (error.code === "23505") {
    if (error.message.includes("students_school_roll_key")) {
      return "That roll number is already used by another student in this school.";
    }
    if (error.message.includes("classes_school_name_key")) {
      return "A class with that name already exists.";
    }
    if (error.message.includes("subjects_school_class_code_key")) {
      return "That subject code is already used in this class.";
    }
    if (error.message.includes("attendance_student_subject_date_key")) {
      return "Attendance for that student, subject and date has already been recorded.";
    }
    if (error.message.includes("exam_results_student_subject_key")) {
      return "Marks for that student and subject have already been recorded.";
    }
    if (error.message.includes("teacher_attendance_teacher_date_key")) {
      return "Attendance for that teacher on that date has already been recorded.";
    }
    if (error.message.includes("schools_slug_key")) {
      return "A school with a similar name already exists.";
    }
    // Phase 1 - fees and finance
    if (error.message.includes("fee_structures_school_class_term_description_key")) {
      return "A fee structure for that class, term and description already exists.";
    }
    if (error.message.includes("fee_assessments_student_term_key")) {
      return "That pupil already has an assessment for this term.";
    }
    if (error.message.includes("budget_lines_school_term_cost_centre_description_key")) {
      return "A budget line for that term and cost centre already exists.";
    }
    return "That record already exists.";
  }

  // 23503 foreign_key_violation
  if (error.code === "23503") {
    return "A referenced record (class, subject or user) no longer exists.";
  }

  // 42501 insufficient_privilege - raised by RLS when a policy denies the write
  if (error.code === "42501") {
    return "You do not have permission to make that change.";
  }

  // Raised by public.assert_subject_teacher_is_teacher()
  if (error.code === "23514" && error.message.includes("requires role teacher")) {
    return "The selected person is not a teacher.";
  }

  return error.message;
}

/** Normalises a thrown value into a message. */
export function describeThrown(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/** Reads a trimmed string field, returning null when empty. */
export function readString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Reads an integer field, returning null when absent or not a whole number. */
export function readInt(formData: FormData, key: string): number | null {
  const raw = readString(formData, key);
  if (raw === null) {
    return null;
  }
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

/** Reads a decimal field, returning null when absent or not a number. */
export function readNumber(formData: FormData, key: string): number | null {
  const raw = readString(formData, key);
  if (raw === null) {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
