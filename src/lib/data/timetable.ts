import "server-only";

import { compareClassNames } from "@/lib/class-order";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listSubjects } from "@/lib/data/queries";

/**
 * Read layer for the weekly timetable.
 *
 * Like `queries.ts`, nothing here filters by `school_id` and nothing checks the
 * caller's role: Row Level Security decides the rows. That matters more than
 * usual for this module, because the same helper answers four different
 * questions - an admin and a schedule officer see the whole school's week, a
 * teacher only the slots of the subjects they teach, and a pupil only their own
 * class's week (see `timetable_slots_select_*` and `v_timetable_weekly` in
 * supabase/migrations/20260101000950_staff_portals.sql). A helper that returned
 * the wrong rows would be a policy bug, not a helper bug, and a role check here
 * could only duplicate a decision the database has already made.
 *
 * A lesson points at a *subject* and nothing else. `subjects` already carries
 * `class_id` and `teacher_id`, so the class and the teacher of a lesson are
 * derived, never copied - which is why every view model below resolves them
 * from the subject rather than storing them.
 */

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

export type TimetableSlotSummary = {
  /**
   * `timetable_slots.id`. The weekly view deliberately carries no slot id - it
   * is a reading view - but a grid whose cells can be moved or removed needs
   * one, so `listTimetableSlots` pairs each row with its slot id.
   */
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classId: string;
  className: string;
  teacherId: string | null;
  teacherName: string | null;
  /** 1 = Monday ... 5 = Friday. */
  dayOfWeek: number;
  /** 1 ... 12. */
  period: number;
  room: string | null;
};

export type UnscheduledSubject = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  /** The free-text pattern the officer keeps in step with the periods. */
  sessions: string;
  classId: string;
  className: string;
  teacherId: string | null;
  teacherName: string | null;
};

export type ClassTimetableCoverage = {
  classId: string;
  className: string;
  /** Subjects that belong to the class. */
  subjectCount: number;
  /** Of those, the subjects that hold at least one slot in the week. */
  scheduledCount: number;
  /** `scheduledCount / subjectCount` as a percentage, one decimal place. */
  percentage: number;
};

export type SubjectSlotCount = {
  subjectId: string;
  slotCount: number;
};

// ---------------------------------------------------------------------------
// The week
// ---------------------------------------------------------------------------

/**
 * Every slot in the week, in week order.
 *
 * Read from `v_timetable_weekly`, which already joins the subject, its class
 * and its teacher - one query instead of four. The slot ids come from a second
 * read of the table, paired by `(subject_id, day_of_week, period)`: that triple
 * is unique on `timetable_slots` (`timetable_slots_subject_day_period_key`), so
 * it identifies the row exactly.
 */
export async function listTimetableSlots(): Promise<TimetableSlotSummary[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: week }, { data: slots }] = await Promise.all([
    supabase
      .from("v_timetable_weekly")
      .select(
        "subject_id, subject_name, subject_code, class_id, class_name, teacher_id, teacher_name, day_of_week, period, room",
      )
      .order("day_of_week")
      .order("period"),
    supabase.from("timetable_slots").select("id, subject_id, day_of_week, period"),
  ]);

  const idByPlacement = new Map(
    (slots ?? []).map((row) => [`${row.subject_id}:${row.day_of_week}:${row.period}`, row.id]),
  );

  return (week ?? []).map((row) => ({
    // A placement with no matching row would mean the view and the table
    // disagreed. The subject id stands in so the lesson still appears in the
    // week; the editor then reports it as no longer there, which is honest,
    // rather than the grid quietly dropping it.
    id: idByPlacement.get(`${row.subject_id}:${row.day_of_week}:${row.period}`) ?? row.subject_id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    subjectCode: row.subject_code,
    classId: row.class_id,
    className: row.class_name,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    dayOfWeek: row.day_of_week,
    period: row.period,
    room: row.room,
  }));
}

// ---------------------------------------------------------------------------
// The gap
// ---------------------------------------------------------------------------

/**
 * Subjects that hold no slot yet - the officer's to-do list.
 *
 * This is the same test the header feed makes in `@/lib/data/header` (every
 * subject minus the subjects that hold a slot), so the bell and this list can
 * never report different numbers. `listSubjects()` already resolves the class
 * and the teacher names, so the only extra read is the set of placed subjects.
 */
export async function listUnscheduledSubjects(): Promise<UnscheduledSubject[]> {
  const supabase = await createSupabaseServerClient();

  const [subjects, slots] = await Promise.all([
    listSubjects(),
    supabase.from("timetable_slots").select("subject_id"),
  ]);

  const scheduled = new Set((slots.data ?? []).map((row) => row.subject_id));

  return subjects
    .filter((subject) => !scheduled.has(subject.id))
    .map((subject) => ({
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      sessions: subject.sessions,
      classId: subject.classId,
      className: subject.className,
      teacherId: subject.teacherId,
      teacherName: subject.teacherName,
    }))
    // Grouped by class rather than left in `listSubjects()`'s name order: the
    // officer places a class's subjects in one sitting, so the class is the
    // order the to-do list is actually worked through.
    .sort(
      (a, b) =>
        a.className.localeCompare(b.className) || a.subjectName.localeCompare(b.subjectName),
    );
}

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------

/**
 * Per class: how many subjects it has, how many of them are placed, and the
 * percentage that represents.
 *
 * A subject counts as scheduled once it holds one or more slots - the number of
 * slots a subject carries is deliberately not judged here, because the schema
 * has no periods-per-week figure to judge it against (`subjects.sessions` is
 * free text). A class with no subjects reports 0%, not 100%: there is nothing
 * to have covered.
 *
 * Three narrow reads rather than a loop: classes for the names, subjects for
 * the pairs, slots for the set that is placed.
 */
export async function summariseTimetableCoverage(): Promise<ClassTimetableCoverage[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: classes }, { data: subjects }, { data: slots }] = await Promise.all([
    // Unordered here and sorted with the school's progression below: the
    // coverage table reads top-down as Nursery, KG, Primary, not alphabetically.
    supabase.from("classes").select("id, name"),
    supabase.from("subjects").select("id, class_id"),
    supabase.from("timetable_slots").select("subject_id"),
  ]);

  const scheduled = new Set((slots ?? []).map((row) => row.subject_id));

  const byClass = new Map<string, { subjectCount: number; scheduledCount: number }>();
  for (const subject of subjects ?? []) {
    const entry = byClass.get(subject.class_id) ?? { subjectCount: 0, scheduledCount: 0 };
    entry.subjectCount += 1;
    if (scheduled.has(subject.id)) {
      entry.scheduledCount += 1;
    }
    byClass.set(subject.class_id, entry);
  }

  return (classes ?? [])
    .slice()
    .sort((a, b) => compareClassNames(a.name, b.name))
    .map((row) => {
      const entry = byClass.get(row.id) ?? { subjectCount: 0, scheduledCount: 0 };

      return {
        classId: row.id,
        className: row.name,
        subjectCount: entry.subjectCount,
        scheduledCount: entry.scheduledCount,
        percentage:
          entry.subjectCount > 0
            ? Math.round((entry.scheduledCount / entry.subjectCount) * 1000) / 10
            : 0,
      };
    });
}

/**
 * How many slots each subject holds.
 *
 * A subject with no slot is absent from the result rather than present as a
 * zero - the same shape `listAttendanceCoverageForDate` returns - so the caller
 * reads the gap with `?? 0`.
 */
export async function listSlotCountsBySubject(): Promise<SubjectSlotCount[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.from("timetable_slots").select("subject_id");

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.subject_id, (counts.get(row.subject_id) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([subjectId, slotCount]) => ({ subjectId, slotCount }));
}
