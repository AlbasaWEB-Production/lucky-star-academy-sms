import { Box, Paper, TableCell, TableRow, TextField, Typography } from "@mui/material";

import ProfileNameForm from "@/components/account/ProfileNameForm";
import PageHeader from "@/components/ui/PageHeader";
import TableShell from "@/components/ui/TableShell";
import { loadShellContext } from "@/lib/auth/shell-context";
import { getOwnTeacherAssignments } from "@/lib/data/queries";

export const metadata = {
  title: "My profile",
};

/**
 * The teacher's own profile.
 *
 * `loadShellContext("teacher")` is used rather than `requireRoleWithTenant`
 * alone because it also returns the `profiles.full_name` / `profiles.email`
 * values. `updateOwnNameAction` writes to `profiles` only, so the JWT copy in
 * `session.fullName` goes stale until the token refreshes - reading the row
 * keeps the name correct immediately after a rename. The shell context calls
 * `requireRoleWithTenant("teacher")` internally, so the page stays guarded.
 */
export default async function TeacherProfilePage() {
  const { session, fullName, email, schoolName } = await loadShellContext("teacher");
  const assignments = await getOwnTeacherAssignments(session.id);

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Your account details and the subjects you teach."
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
              Role: Teacher
            </Typography>
            <Typography variant="body2" color="text.secondary">
              School: {schoolName}
            </Typography>
          </Box>
        </Paper>

        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Subjects you teach
          </Typography>

          <TableShell
            headers={["Subject", "Code", "Class"]}
            isEmpty={assignments.length === 0}
            emptyMessage="No subjects have been assigned to you yet. An administrator assigns subjects to teachers."
          >
            {assignments.map((assignment) => (
              <TableRow key={assignment.subjectId}>
                <TableCell>{assignment.subjectName}</TableCell>
                <TableCell>{assignment.subjectCode}</TableCell>
                <TableCell>{assignment.className}</TableCell>
              </TableRow>
            ))}
          </TableShell>
        </Box>
      </Box>
    </>
  );
}
