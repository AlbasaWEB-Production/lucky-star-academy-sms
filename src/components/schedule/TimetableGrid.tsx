"use client";

import { Fragment, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";

import type { TimetableSlotSummary } from "@/lib/data/timetable";
import SlotEditorDialog from "./SlotEditorDialog";
import { DAY_NUMBERS, PERIODS, WEEKDAY_SHORT, weekdayName } from "./weekdays";

/**
 * The week.
 *
 * Two presentations of the same rows, because one cannot serve both ends of the
 * size range:
 *
 *   - `md` and up: a CSS grid, 12 period rows by 5 weekday columns. A cell can
 *     hold more than one lesson - the uniqueness the schema enforces is per
 *     *subject*, so two subjects of one class may share a period (in different
 *     rooms, or with no room arranged yet) - so every cell is a list.
 *   - below `md`: the fixed six-column grid would be squeezed to about 50px a
 *     column, which is unreadable at 360px, so the same lessons are listed
 *     day by day instead. Nothing overflows sideways and no cell is clipped.
 *
 * Each lesson is a single button that opens its editor. At roughly 150px wide, a
 * grid cell has no room for a second control, and the button's accessible name
 * carries the whole lesson ("Mathematics (MTH), Monday period 3, Room 3").
 *
 * The dialog's slot is looked up in the current props rather than held in
 * state: a deleted lesson closes its own editor, and a moved one shows its new
 * day and period.
 */
export default function TimetableGrid({
  slots,
  showClass,
}: {
  /** The lessons in view - already filtered to one class, or the whole school. */
  slots: TimetableSlotSummary[];
  /** True for the whole-school view, where every lesson names its class. */
  showClass: boolean;
}) {
  const [openSlotId, setOpenSlotId] = useState<string | null>(null);

  const openSlot = slots.find((slot) => slot.id === openSlotId) ?? null;

  const byCell = new Map<string, TimetableSlotSummary[]>();
  for (const slot of slots) {
    const key = cellKey(slot.dayOfWeek, slot.period);
    const cell = byCell.get(key);
    if (cell) {
      cell.push(slot);
    } else {
      byCell.set(key, [slot]);
    }
  }

  const byDay = new Map<number, TimetableSlotSummary[]>();
  for (const day of DAY_NUMBERS) {
    byDay.set(
      day,
      slots.filter((slot) => slot.dayOfWeek === day).sort((a, b) => a.period - b.period),
    );
  }

  return (
    <>
      {/* The week as a grid: 12 period rows, Monday to Friday. */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "56px repeat(5, minmax(0, 1fr))",
            gap: 0.5,
          }}
        >
          <Box />

          {DAY_NUMBERS.map((day) => (
            <Typography
              key={day}
              variant="caption"
              sx={{ fontWeight: 600, color: "secondary.main", textAlign: "center", pb: 0.5 }}
            >
              {WEEKDAY_SHORT[day - 1]}
            </Typography>
          ))}

          {PERIODS.map((period) => (
            <Fragment key={period}>
              <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {`P${period}`}
                </Typography>
              </Box>

              {DAY_NUMBERS.map((day) => {
                const lessons = byCell.get(cellKey(day, period)) ?? [];

                return (
                  <Box
                    key={day}
                    sx={{
                      minHeight: 44,
                      p: 0.5,
                      borderRadius: "12px",
                      backgroundColor: lessons.length > 0 ? "action.hover" : "transparent",
                    }}
                  >
                    {lessons.length === 0 ? (
                      // Decorative: a free period is conveyed by the absence of
                      // a lesson button, and 60 dashes read aloud help nobody.
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        aria-hidden
                        sx={{ display: "block", textAlign: "center", pt: 1 }}
                      >
                        –
                      </Typography>
                    ) : (
                      <Box sx={{ display: "grid", gap: 0.5 }}>
                        {lessons.map((slot) => (
                          <LessonButton
                            key={slot.id}
                            slot={slot}
                            showClass={showClass}
                            onOpen={() => setOpenSlotId(slot.id)}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Fragment>
          ))}
        </Box>
      </Box>

      {/* The same week, stacked day by day, for a phone. */}
      <Box sx={{ display: { xs: "grid", md: "none" }, gap: 2 }}>
        {DAY_NUMBERS.map((day) => {
          const lessons = byDay.get(day) ?? [];

          return (
            <Paper key={day} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" component="h3">
                {weekdayName(day)}
              </Typography>

              {lessons.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nothing scheduled.
                </Typography>
              ) : (
                <Box sx={{ display: "grid", gap: 1, mt: 1 }}>
                  {lessons.map((slot) => (
                    <Box key={slot.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, minWidth: 26, pt: 1 }}
                      >
                        {`P${slot.period}`}
                      </Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <LessonButton
                          slot={slot}
                          showClass={showClass}
                          onOpen={() => setOpenSlotId(slot.id)}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>

      <SlotEditorDialog slot={openSlot} onClose={() => setOpenSlotId(null)} />
    </>
  );
}

/** One cell of the week: a day and a period. */
function cellKey(dayOfWeek: number, period: number): string {
  return `${dayOfWeek}:${period}`;
}

/**
 * One lesson, as the button that opens its editor.
 *
 * A lesson with no teacher yet is a real state rather than a gap - a subject can
 * exist before the admin assigns anyone to it - so it says so instead of
 * rendering an empty line.
 */
function LessonButton({
  slot,
  showClass,
  onOpen,
}: {
  slot: TimetableSlotSummary;
  showClass: boolean;
  onOpen: () => void;
}) {
  const where = `${weekdayName(slot.dayOfWeek)}, period ${slot.period}`;

  return (
    <Box
      component="button"
      type="button"
      onClick={onOpen}
      aria-label={`${slot.subjectName} (${slot.subjectCode})${
        showClass ? `, ${slot.className}` : ""
      }, ${where}. Open to move or remove this lesson.`}
      sx={{
        display: "block",
        width: "100%",
        p: 0.75,
        textAlign: "left",
        font: "inherit",
        cursor: "pointer",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        backgroundColor: "background.paper",
        "&:hover": { borderColor: "primary.main" },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 1,
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{ display: "block", fontWeight: 600, color: "secondary.main", lineHeight: 1.3 }}
      >
        {slot.subjectCode}
      </Typography>
      <Typography variant="caption" sx={{ display: "block", lineHeight: 1.3 }}>
        {slot.subjectName}
      </Typography>
      {showClass ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
          {slot.className}
        </Typography>
      ) : null}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
        {slot.room ?? "No room yet"}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
        {slot.teacherName ?? "No teacher yet"}
      </Typography>
    </Box>
  );
}
