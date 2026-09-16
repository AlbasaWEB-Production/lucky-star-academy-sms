import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { visuallyHidden } from "@mui/utils";

import type { AttendanceHeatmapCell } from "@/lib/data/dashboard";

/**
 * A day's state, resolved across every subject the pupil was marked in that
 * day. `Partial` is the case the register genuinely produces and a two-state
 * grid cannot express: present for one subject, absent for another.
 */
type DayState = "Present" | "Partial" | "Absent";

/** One pupil's row, with the days they were marked and their rate over them. */
type HeatmapPupil = {
  studentId: string;
  studentName: string;
  rollNumber: number;
  byDate: Map<string, DayState>;
  /** Days with at least one present mark. */
  present: number;
  /** Distinct days marked, however many subjects were marked on them. */
  marked: number;
};

const CELL = 28;

/**
 * Colour, glyph and text colour for each state.
 *
 * `glyph` matters as much as `colour`: it is what stops this being a grid whose
 * meaning is carried by hue alone, which fails both greyscale printing and
 * WCAG 1.4.1. Four states, distinguishable with the colour switched off:
 * present is a filled square, partial carries a tilde, absent carries a cross,
 * and a day the pupil was not marked is an empty dashed outline.
 *
 * `text` is per state rather than a single white, because white on the gold
 * partial fill does not meet contrast.
 */
const STATES: Record<DayState | "Unmarked", { colour: string; glyph: string; label: string; text: string }> = {
  Present: { colour: "#147B45", glyph: "", label: "Present", text: "#ffffff" },
  Partial: { colour: "#F2B705", glyph: "~", label: "Present in some subjects", text: "#083E28" },
  Absent: { colour: "#B3261E", glyph: "×", label: "Absent", text: "#ffffff" },
  Unmarked: { colour: "transparent", glyph: "", label: "Not marked", text: "#ffffff" },
};

function dayNumber(date: string): string {
  return String(Number(date.slice(8, 10)));
}

function fullDate(date: string): string {
  // Parsed as UTC so the rendered date cannot slip a day backwards.
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Pupil-by-day attendance grid.
 *
 * The question it answers is the one a rate hides: *who* is drifting, and is it
 * a run of days or scattered? A class at 80% could be one pupil missing a
 * fortnight or twenty pupils missing a day, and those need different responses
 * from a teacher.
 *
 * A Server Component - it reads data and draws it, with no state and no
 * handlers - so it can be dropped straight into a server page.
 */
export default function AttendanceHeatmap({ cells }: { cells: AttendanceHeatmapCell[] }) {
  // Both axes are derived from the rows, so the grid never claims a day or a
  // pupil it has no data for.
  const dates = [...new Set(cells.map((cell) => cell.date))].sort();

  const pupilsById = new Map<string, HeatmapPupil>();

  // Tallies are collected per pupil per day, and each day is resolved to a
  // single state only once every one of its rows has been counted. Writing the
  // status straight into `byDate` would let the last row win, so a pupil marked
  // present in one subject and absent in another on the same day would render
  // as whichever the query happened to return last - an arbitrary answer to a
  // question the reader thinks has one.
  const talliesByPupil = new Map<string, Map<string, { present: number; absent: number }>>();

  for (const cell of cells) {
    let pupil = pupilsById.get(cell.studentId);
    if (!pupil) {
      pupil = {
        studentId: cell.studentId,
        studentName: cell.studentName,
        rollNumber: cell.rollNumber,
        byDate: new Map(),
        present: 0,
        marked: 0,
      };
      pupilsById.set(cell.studentId, pupil);
    }

    let byDate = talliesByPupil.get(cell.studentId);
    if (!byDate) {
      byDate = new Map();
      talliesByPupil.set(cell.studentId, byDate);
    }

    let tally = byDate.get(cell.date);
    if (!tally) {
      tally = { present: 0, absent: 0 };
      byDate.set(cell.date, tally);
    }

    if (cell.status === "Present") {
      tally.present += 1;
    } else {
      tally.absent += 1;
    }
  }

  for (const pupil of pupilsById.values()) {
    const byDate = talliesByPupil.get(pupil.studentId);
    if (!byDate) continue;

    for (const [date, tally] of byDate) {
      const state: DayState =
        tally.absent === 0 ? "Present" : tally.present === 0 ? "Absent" : "Partial";

      pupil.byDate.set(date, state);
      pupil.marked += 1;
      if (tally.present > 0) {
        pupil.present += 1;
      }
    }
  }

  const pupils = [...pupilsById.values()].sort((a, b) => a.rollNumber - b.rollNumber);

  if (pupils.length === 0 || dates.length === 0) {
    return null;
  }

  return (
    <Box>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ width: "auto", minWidth: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell
                scope="col"
                sx={{ position: "sticky", left: 0, backgroundColor: "background.paper", whiteSpace: "nowrap" }}
              >
                Pupil
              </TableCell>
              {dates.map((date) => (
                <TableCell key={date} scope="col" align="center" sx={{ px: 0.5, whiteSpace: "nowrap" }}>
                  <Box component="span" aria-hidden sx={{ display: "block", fontSize: 12, lineHeight: 1.4 }}>
                    {dayNumber(date)}
                  </Box>
                  <Box component="span" sx={visuallyHidden}>
                    {fullDate(date)}
                  </Box>
                </TableCell>
              ))}
              <TableCell scope="col" align="right" sx={{ whiteSpace: "nowrap" }}>
                Days present
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pupils.map((pupil) => {
              const rate = pupil.marked === 0 ? null : Math.round((pupil.present / pupil.marked) * 1000) / 10;

              return (
                <TableRow key={pupil.studentId}>
                  <TableCell
                    scope="row"
                    component="th"
                    sx={{ position: "sticky", left: 0, backgroundColor: "background.paper", whiteSpace: "nowrap" }}
                  >
                    <Typography variant="body2" component="span">
                      {pupil.studentName}
                    </Typography>
                  </TableCell>

                  {dates.map((date) => {
                    const status = pupil.byDate.get(date);
                    const state = status ? STATES[status] : STATES.Unmarked;

                    return (
                      <TableCell key={date} align="center" sx={{ px: 0.5, py: 0.5 }}>
                        <Box
                          // The accessible name carries the whole meaning, so a
                          // screen reader hears a sentence per day rather than
                          // announcing a grid of nameless squares.
                          role="img"
                          aria-label={`${pupil.studentName}, ${fullDate(date)}: ${state.label}`}
                          sx={{
                            width: CELL,
                            height: CELL,
                            mx: "auto",
                            borderRadius: "6px",
                            display: "grid",
                            placeItems: "center",
                            color: state.text,
                            fontSize: 15,
                            lineHeight: 1,
                            backgroundColor: state.colour,
                            ...(status
                              ? {}
                              : { border: "1px dashed", borderColor: "divider" }),
                          }}
                        >
                          <Box component="span" aria-hidden>
                            {state.glyph}
                          </Box>
                        </Box>
                      </TableCell>
                    );
                  })}

                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
                      {rate === null ? "—" : `${rate}%`}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
        {(["Present", "Partial", "Absent", "Unmarked"] as const).map((key) => (
          <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box
              aria-hidden
              sx={{
                width: 16,
                height: 16,
                borderRadius: "4px",
                display: "grid",
                placeItems: "center",
                color: STATES[key].text,
                fontSize: 11,
                lineHeight: 1,
                backgroundColor: STATES[key].colour,
                ...(key === "Unmarked" ? { border: "1px dashed", borderColor: "divider" } : {}),
              }}
            >
              {STATES[key].glyph}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {STATES[key].label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
