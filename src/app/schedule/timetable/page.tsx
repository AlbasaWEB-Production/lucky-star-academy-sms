import Link from "@/components/NextLink";
import { Box, Button, Paper, Typography } from "@mui/material";

import AddTimetableSlotForm from "@/components/schedule/AddTimetableSlotForm";
import ClassFilterSelect, { ALL_CLASSES } from "@/components/schedule/ClassFilterSelect";
import TimetableGrid from "@/components/schedule/TimetableGrid";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { listTimetableSlots } from "@/lib/data/timetable";
import { listClasses, listSubjects } from "@/lib/data/queries";

export const metadata = {
  title: "Weekly timetable",
};

/** "1 lesson" / "3 lessons" - the plural is written once, here. */
function lessons(count: number): string {
  return `${count} lesson${count === 1 ? "" : "s"}`;
}

/**
 * The week, one class at a time by default.
 *
 * The whole school in one grid is unreadable - 12 periods by 5 days, each cell
 * holding several classes' lessons - so `?class=` narrows it and the page opens
 * on the first class alphabetically. `?class=all` is the explicit whole-school
 * view, where every lesson names its class.
 *
 * The filtering happens here, on the server, over the rows `listTimetableSlots()`
 * already returned: the URL is the state (see "Searching a list" in
 * PAGE-CONVENTIONS), no parameter reaches Supabase, and the view is shareable.
 * The grid and the two forms are client components; this page only reads and
 * renders.
 *
 * No role check: the `/schedule` layout has already loaded the shell context for
 * the schedule officer, and RLS is what actually scopes the rows.
 */
export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { class: classParam = "" } = await searchParams;

  const [slots, classes, subjectList] = await Promise.all([
    listTimetableSlots(),
    listClasses(),
    listSubjects(),
  ]);

  const wholeSchool = classParam === ALL_CLASSES;
  const requested = classes.find((classroom) => classroom.id === classParam)?.id;
  const selectedClassId = wholeSchool ? "" : (requested ?? classes[0]?.id ?? "");
  const selectedClass = classes.find((classroom) => classroom.id === selectedClassId) ?? null;

  const visibleSlots = selectedClassId
    ? slots.filter((slot) => slot.classId === selectedClassId)
    : slots;

  // Everything below is derived from the rows already in hand - the same reads
  // the grid renders, so the caption can never contradict the grid.
  const placedSubjects = new Set(visibleSlots.map((slot) => slot.subjectId));
  const classSubjects = selectedClass
    ? subjectList.filter((subject) => subject.classId === selectedClass.id)
    : [];
  const classPlaced = classSubjects.filter((subject) => placedSubjects.has(subject.id)).length;
  const classUnplaced = classSubjects.length - classPlaced;

  // Ordered by class then subject: the form lists a whole school's subjects in
  // one select, so the class is the only useful grouping.
  const subjects = subjectList
    .map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      className: subject.className,
    }))
    .sort(
      (a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name),
    );

  const subtitle =
    classes.length === 0
      ? "No classes yet, so there is no week to arrange."
      : selectedClass
        ? `${selectedClass.name} — ${lessons(visibleSlots.length)} in the week, ${classPlaced} of ${classSubjects.length} subjects placed.`
        : `Whole school — ${lessons(visibleSlots.length)} across ${classes.length} class${classes.length === 1 ? "" : "es"}.`;

  const scopeCaption = selectedClass
    ? `${classSubjects.length} subject${classSubjects.length === 1 ? "" : "s"} in this class, ${classUnplaced} still to place.`
    : `${placedSubjects.size} subject${placedSubjects.size === 1 ? "" : "s"} placed in the week.`;

  return (
    <>
      <PageHeader
        title="Weekly timetable"
        subtitle={subtitle}
        action={
          <Button component={Link} href="/schedule/subjects" variant="outlined">
            Subjects to place
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Place a lesson
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Schedule a subject into the week
        </Typography>

        {subjects.length === 0 ? (
          <EmptyState
            title="No subjects to place"
            description="Every lesson belongs to a subject, and a subject belongs to a class. An administrator creates them; once one exists it can be placed in the week here."
          />
        ) : (
          <AddTimetableSlotForm subjects={subjects} />
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              Week view
            </Typography>
            <Typography variant="h6">
              {selectedClass ? selectedClass.name : "Whole school"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {scopeCaption}
            </Typography>
          </Box>

          {classes.length > 0 ? (
            <ClassFilterSelect classes={classes} value={wholeSchool ? ALL_CLASSES : selectedClassId} />
          ) : null}
        </Box>

        {classes.length === 0 ? (
          <EmptyState
            title="No classes to timetable"
            description="A class and its subjects are created by an administrator. Once a class exists with subjects, its week can be arranged here."
          />
        ) : visibleSlots.length === 0 ? (
          <EmptyState
            title={
              selectedClass
                ? `Nothing scheduled for ${selectedClass.name} yet`
                : "Nothing scheduled yet"
            }
            description={
              classSubjects.length === 0 && selectedClass
                ? "This class has no subjects yet. Subjects are created by an administrator; once they exist, their lessons can be placed here."
                : "Choose a subject, a day and a period in the form above to place the first lesson."
            }
          />
        ) : (
          <TimetableGrid slots={visibleSlots} showClass={wholeSchool} />
        )}
      </Paper>
    </>
  );
}
