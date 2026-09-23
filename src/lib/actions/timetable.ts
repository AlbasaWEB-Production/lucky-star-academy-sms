"use server";

import { revalidatePath } from "next/cache";

import { PERIOD_COUNT, WEEKDAYS, weekdayName } from "@/components/schedule/weekdays";
import {
  describeDatabaseError,
  fail,
  readInt,
  readString,
  succeed,
  type FormActionResult,
} from "@/lib/actions/result";
import { requireTimetableWithTenant } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server actions for the weekly timetable.
 *
 * Every action re-checks the caller's role with `requireTimetableWithTenant`
 * (admin or schedule officer) even though RLS would refuse the write anyway.
 * The duplication is intentional, exactly as in `roster.ts`: RLS is the
 * security boundary, and the guard exists so a wrong-role caller gets a clear
 * message instead of an opaque permission error.
 *
 * `school_id` always comes from that session, never from the form. The class
 * and the teacher of a lesson are never written here either - they are derived
 * from `subjects`, which owns both.
 *
 * WHY THESE RETURN `succeed` RATHER THAN `redirect`
 *
 * `roster.ts` redirects after a create and an update because its forms live on
 * their own route, so the redirect is what returns the user to the list. The
 * timetable's forms live *on* the week they edit, so navigating would only throw
 * away the class filter the officer is working in - and, worse, a redirect
 * leaves `useActionState` holding the previous error, so a clash message could
 * sit under a form that has just succeeded. Revalidating and staying put is what
 * the deletes already do in this codebase, and it refreshes the grid in place.
 */

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const TIMETABLE_PATH = "/schedule/timetable";

type ScheduleInput = { dayOfWeek: number; period: number };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads the day and period, and refuses anything outside the ranges before a
 * single query is issued.
 *
 * The database would reject both anyway (`timetable_slots_day_of_week_range`,
 * `timetable_slots_period_range`), but a check constraint's error is not a
 * sentence, and a form that posts day 0 is a UI bug worth naming precisely.
 */
function readSchedule(formData: FormData): { schedule: ScheduleInput } | { error: string } {
  const dayOfWeek = readInt(formData, "dayOfWeek");
  const period = readInt(formData, "period");

  if (dayOfWeek === null || dayOfWeek < 1 || dayOfWeek > WEEKDAYS.length) {
    return { error: `Choose a day between ${WEEKDAYS[0]} and ${WEEKDAYS[WEEKDAYS.length - 1]}.` };
  }

  if (period === null || period < 1 || period > PERIOD_COUNT) {
    return { error: `Period must be a whole number between 1 and ${PERIOD_COUNT}.` };
  }

  return { schedule: { dayOfWeek, period } };
}

/**
 * The message for a subject that already holds that day and period, or null
 * when the period is free.
 *
 * `exceptSlotId` is what lets a move be checked against itself: a lesson is
 * allowed to stay exactly where it is.
 */
async function subjectClash(
  supabase: Supabase,
  subjectId: string,
  dayOfWeek: number,
  period: number,
  exceptSlotId?: string,
): Promise<string | null> {
  let query = supabase
    .from("timetable_slots")
    .select("id, room")
    .eq("subject_id", subjectId)
    .eq("day_of_week", dayOfWeek)
    .eq("period", period);

  if (exceptSlotId) {
    query = query.neq("id", exceptSlotId);
  }

  const { data } = await query.limit(1);
  const clash = data?.[0];

  if (!clash) {
    return null;
  }

  // Only on the clash path, so the happy path stays one query.
  const { data: subject } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", subjectId)
    .maybeSingle();

  const name = subject?.name ?? "That subject";
  const where = `${weekdayName(dayOfWeek)}, period ${period}`;
  const room = clash.room ? ` (${clash.room})` : "";

  return `${name} already has a lesson on ${where}${room}. A subject cannot be in two places at once - move that lesson first, or choose another period.`;
}

/**
 * The message for a room that already hosts a lesson at that day and period, or
 * null when the room is free at that time.
 *
 * `room` is compared as exact text because that is how the database compares
 * it: `timetable_slots_school_day_period_room_key` is a unique index on the raw
 * value, so "Room 3" and "room 3" are two different rooms. This check exists to
 * name the lesson in the message; the index is what actually prevents the clash.
 */
async function roomClash(
  supabase: Supabase,
  schoolId: string,
  dayOfWeek: number,
  period: number,
  room: string,
  exceptSlotId?: string,
): Promise<string | null> {
  let query = supabase
    .from("timetable_slots")
    .select("id, subject_id")
    .eq("school_id", schoolId)
    .eq("day_of_week", dayOfWeek)
    .eq("period", period)
    .eq("room", room);

  if (exceptSlotId) {
    query = query.neq("id", exceptSlotId);
  }

  const { data } = await query.limit(1);
  const clash = data?.[0];

  if (!clash) {
    return null;
  }

  // The view already resolves the subject and class names that make the message
  // worth reading, and this runs only when there is something to report.
  const { data: named } = await supabase
    .from("v_timetable_weekly")
    .select("subject_name, class_name")
    .eq("subject_id", clash.subject_id)
    .eq("day_of_week", dayOfWeek)
    .eq("period", period)
    .limit(1);

  const lesson = named?.[0];
  const who = lesson
    ? `${lesson.subject_name} (${lesson.class_name})`
    : "another lesson";

  return `${room} already hosts ${who} on ${weekdayName(dayOfWeek)}, period ${period}. A room cannot host two lessons at once - choose another room or another period.`;
}

/**
 * Turns a timetable write failure into a sentence.
 *
 * `describeDatabaseError` covers the constraints the rest of the schema raises;
 * the two the timetable adds are mapped here, beside the writes that can raise
 * them, so a clash never reaches the officer as
 * `duplicate key value violates unique constraint ...`. The checks above catch
 * the ordinary case first - this is the backstop for the race between that
 * check and the insert.
 */
function describeWriteError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    if (error.message.includes("timetable_slots_school_day_period_room_key")) {
      return "That room already hosts another lesson at that day and period. A room cannot host two lessons at once - choose another room or another period.";
    }
    if (error.message.includes("timetable_slots_subject_day_period_key")) {
      return "That subject already has a lesson in that day and period. A subject cannot be in two places at once - move the existing lesson, or choose another period.";
    }
  }

  if (error.code === "23514") {
    if (error.message.includes("timetable_slots_room_not_blank")) {
      return "A room name cannot be blank. Leave the field empty if no room has been arranged yet.";
    }
    if (error.message.includes("timetable_slots_day_of_week_range")) {
      return `Day of week must be ${WEEKDAYS[0]} (1) to ${WEEKDAYS[WEEKDAYS.length - 1]} (${WEEKDAYS.length}).`;
    }
    if (error.message.includes("timetable_slots_period_range")) {
      return `Period must be between 1 and ${PERIOD_COUNT}.`;
    }
  }

  return describeDatabaseError(error);
}

/**
 * One call covers the whole portal: the layout carries the header's "subjects
 * with no timetable slot" count, and a layout revalidation invalidates every
 * page beneath it - the week, the dashboard and the subject list. The week
 * itself is named as well, so the page being edited is always refreshed even if
 * a future layout stops carrying timetable data.
 */
function revalidateTimetable(): void {
  revalidatePath(TIMETABLE_PATH);
  revalidatePath("/schedule", "layout");
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createTimetableSlotAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireTimetableWithTenant();

  const subjectId = readString(formData, "subjectId");
  const room = readString(formData, "room");
  const parsed = readSchedule(formData);

  if (!subjectId) {
    return fail("Choose the subject to place.");
  }

  if ("error" in parsed) {
    return fail(parsed.error);
  }

  const { dayOfWeek, period } = parsed.schedule;
  const supabase = await createSupabaseServerClient();

  // Read back to prove the subject exists and is in this school: RLS returns
  // nothing for a subject the caller cannot see, so a forged id lands on the
  // same message rather than on a foreign-key error.
  const { data: subject } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", subjectId)
    .maybeSingle();

  if (!subject) {
    return fail("That subject no longer exists. Reload the page and choose another.");
  }

  const subjectTaken = await subjectClash(supabase, subjectId, dayOfWeek, period);
  if (subjectTaken) {
    return fail(subjectTaken);
  }

  if (room) {
    const roomTaken = await roomClash(supabase, user.schoolId, dayOfWeek, period, room);
    if (roomTaken) {
      return fail(roomTaken);
    }
  }

  const { error } = await supabase.from("timetable_slots").insert({
    school_id: user.schoolId,
    subject_id: subjectId,
    day_of_week: dayOfWeek,
    period,
    room,
  });

  if (error) {
    return fail(describeWriteError(error));
  }

  revalidateTimetable();

  // Stay on the week being edited: the class filter and the form the officer is
  // filling in both survive, and the new lesson appears in the grid as soon as
  // the refreshed page lands. If the lesson belongs to a class that is not the
  // one in view, the form's success message is what confirms it was placed.
  return succeed;
}

export async function updateTimetableSlotAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  const user = await requireTimetableWithTenant();

  const slotId = readString(formData, "slotId");
  const room = readString(formData, "room");
  const parsed = readSchedule(formData);

  if (!slotId) {
    return fail("Missing lesson.");
  }

  if ("error" in parsed) {
    return fail(parsed.error);
  }

  const { dayOfWeek, period } = parsed.schedule;
  const supabase = await createSupabaseServerClient();

  const { data: slot } = await supabase
    .from("timetable_slots")
    .select("id, subject_id")
    .eq("id", slotId)
    .maybeSingle();

  if (!slot) {
    return fail("That lesson is no longer in the week. Reload the page to see the timetable as it is now.");
  }

  // A move clashes exactly as a new slot does. Both checks exclude this row, so
  // saving a lesson without changing its position is not a clash with itself.
  const subjectTaken = await subjectClash(supabase, slot.subject_id, dayOfWeek, period, slotId);
  if (subjectTaken) {
    return fail(subjectTaken);
  }

  if (room) {
    const roomTaken = await roomClash(supabase, user.schoolId, dayOfWeek, period, room, slotId);
    if (roomTaken) {
      return fail(roomTaken);
    }
  }

  const { error } = await supabase
    .from("timetable_slots")
    .update({ day_of_week: dayOfWeek, period, room })
    .eq("id", slotId);

  if (error) {
    return fail(describeWriteError(error));
  }

  revalidateTimetable();

  // Same reasoning as the create: the dialog stays open on the week it was
  // opened from, now showing the lesson in its new day and period.
  return succeed;
}

export async function deleteTimetableSlotAction(
  _previous: FormActionResult,
  formData: FormData,
): Promise<FormActionResult> {
  await requireTimetableWithTenant();

  const slotId = readString(formData, "slotId");

  if (!slotId) {
    return fail("Missing lesson.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("timetable_slots").delete().eq("id", slotId);

  if (error) {
    return fail(describeWriteError(error));
  }

  revalidateTimetable();

  // `succeed` rather than a redirect, so the officer stays on the week they are
  // editing - the same choice `deleteSubjectAction` makes. Deleting a slot only
  // removes its place in the week; the subject itself is untouched.
  return succeed;
}
