import { Avatar, Box, Paper, Typography } from "@mui/material";

import ProfileNameForm from "@/components/account/ProfileNameForm";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { requireRoleWithTenant } from "@/lib/auth/session";
import { getOwnStudentRecord, getSchool } from "@/lib/data/queries";

export const metadata = {
  title: "My profile",
};

/** One label/value line of the read-only details card. */
function DetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 2,
        py: 1.25,
        borderBottom: last ? "none" : "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: "right" }}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * The student's own profile.
 *
 * Only the name is editable, and it is editable through the same
 * `ProfileNameForm` the other two portals use - it writes to the caller's own
 * `profiles` row, which the `profiles_update_self` policy permits.
 *
 * The roll number and class are not editable here on purpose: they are
 * enrolment data that the admin owns, and the student login is derived from
 * the roll number, so changing it from this side would change how the student
 * signs in.
 */
export default async function StudentProfilePage() {
  const session = await requireRoleWithTenant("student");

  const [student, school] = await Promise.all([
    getOwnStudentRecord(session.id),
    getSchool(session.schoolId),
  ]);

  if (!student) {
    return (
      <>
        <PageHeader title="My profile" />
        <EmptyState
          title="Your student record is not ready yet"
          description="Your login works, but no student record is linked to it, so there is no roll number or class to show. Ask your school office to complete your enrolment, then sign in again."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Your name is yours to change. Everything else here is set by the school."
      />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
          alignItems: "start",
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: 28 }}>
              {student.fullName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
                {student.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {student.className}
              </Typography>
            </Box>
          </Box>

          <DetailRow label="Roll number" value={String(student.rollNumber)} />
          <DetailRow label="Class" value={student.className} />
          <DetailRow label="School" value={school?.name ?? "Your school"} />
          {session.email ? (
            <>
              <DetailRow label="Internal login identifier" value={session.email} last />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                This is the generated login address your account signs in with. It is internal to the
                system - do not use it as a contact address.
              </Typography>
            </>
          ) : null}
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Your name
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            This is the name your teachers see. It is also half of how you sign in, so use the same
            spelling your school has on record.
          </Typography>

          <ProfileNameForm currentName={student.fullName} />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Your roll number and class are read-only here - only a school administrator can change
            them. If either is wrong, ask the school office to correct it.
          </Typography>
        </Paper>
      </Box>
    </>
  );
}
