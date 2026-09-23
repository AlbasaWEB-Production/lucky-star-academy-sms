/**
 * The school week, written down once.
 *
 * `day_of_week` is 1 = Monday ... 5 = Friday - the same numbering as
 * `extract(isodow from ...)` and the `timetable_slots_day_of_week_range` check
 * constraint - and `period` runs 1..12 (`timetable_slots_period_range`). Every
 * screen derives its labels from these values instead of carrying its own copy,
 * so the grid, the form and the clash messages can never disagree about which
 * day "3" is.
 *
 * Deliberately a plain module with no `"use client"` / `"use server"`
 * directive: the server pages, the client components and
 * `@/lib/actions/timetable` all import it. It sits beside the components for
 * the same reason `@/components/charts/tokens` sits beside the charts.
 */

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

/** Column headings for the week grid, where every pixel of width counts. */
export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

/** 1..5, in the order the week is rendered. */
export const DAY_NUMBERS = [1, 2, 3, 4, 5] as const;

/** The period ceiling the database enforces. */
export const PERIOD_COUNT = 12;

/** 1..12: the rows of the week grid, and the choices in the lesson form. */
export const PERIODS: number[] = Array.from({ length: PERIOD_COUNT }, (_, index) => index + 1);

/** "Monday" for 1..5. Anything else keeps its number rather than a blank cell. */
export function weekdayName(dayOfWeek: number): string {
  return WEEKDAYS[dayOfWeek - 1] ?? `Day ${dayOfWeek}`;
}

/** "Mon" for 1..5, for the grid's column headings. */
export function weekdayShort(dayOfWeek: number): string {
  return WEEKDAY_SHORT[dayOfWeek - 1] ?? `D${dayOfWeek}`;
}
