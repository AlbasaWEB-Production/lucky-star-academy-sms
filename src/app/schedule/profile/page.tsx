import { Box, Paper, TableCell, TableRow, TextField, Typography } from "@mui/material";

import ProfileNameForm from "@/components/account/ProfileNameForm";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { loadShellContext } from "@/lib/auth/shell-context";
import { summariseTimetableCoverage } from "@/lib/data/timetable";

export const metadata = {
  title: "My profile",
};

/**
 * The schedule officer's own account, and the timetable they own.
 *
 * `loadShellContext("schedule_officer")` is used rather than only the raw session
 * because it also returns the `profiles.full_name` / `profiles.email` values -
 * the same helper the `/schedule` layout already called, so it costs two small
 * reads and no role decision of its own. `ProfileNameForm` writes the caller's
 * own `profiles` row through `updateOwnNameAction`, which any role may do, so the
 * name shown here is the one just saved rather than the stale copy in the JWT.
 *
 * The right-hand panel mirrors the teacher's profile: where that page lists the
 * subjects the teacher holds, this one lists the classes the officer timetables
 * and how much of each is placed.
 */
export default async function ScheduleProfilePage() {
  const { fullName, email, schoolName } = await loadShellContext("schedule_officer");
  const coverage = await summariseTimetableCoverage();

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Your account details and the classes you build the timetable for."
      />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "2fr 3fr" },
          alignItems: "start",
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Account
          </Typography>

          <ProfileNameForm currentName={fullName} />

          <TextField
            label="Email address"
            value={email ?? "Not set"}
            fullWidth
            margin="normal"
            slotProps={{
              input: { readOnly: true },
              htmlInput: { "aria-readonly": true },
            }}
            helperText="This is the address you sign in with, so it cannot be changed here. Ask your school administrator to update it."
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Role: Schedule officer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              School: {schoolName}
            </Typography>
          </Box>
        </Paper>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Classes you timetable
          </Typography>

          <TableShell
            headers={["Class", "Subjects", "Placed"]}
            density="compact"
            columnAlign={["left", "right", "right"]}
            isEmpty={coverage.length === 0}
            emptyMessage="No classes yet. An administrator creates classes and their subjects; once they exist, the timetable you own is built here."
          >
            {coverage.map((row) => (
              <TableRow key={row.classId}>
                <TableCell>{row.className}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {row.subjectCount}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {row.scheduledCount}
                </TableCell>
              </TableRow>
            ))}
          </TableShell>
        </Box>
      </Box>
    </>
  );
}
