import { Typography } from "@mui/material";

import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Schedule Officer sign in",
};

/**
 * Sign-in for the schedule officer.
 *
 * Note the mismatch that is deliberate and correct: the route is `/login/schedule`
 * (a URL segment should not carry an underscore), while the role this form
 * submits is `schedule_officer` - the value stored in `app_metadata.role` and
 * checked by every RLS policy. `roleSlug` / `roleLabel` in `@/lib/auth/roles`
 * are the two mappings, in one place each.
 */
export default function ScheduleOfficerLoginPage() {
  return (
    <AuthShell
      title="Schedule Officer sign in"
      subtitle="Welcome back. Please enter your details."
      footer={
        <Typography variant="body2" color="text.secondary" align="center">
          Schedule Officer accounts are created by your school administrator.
        </Typography>
      }
    >
      <LoginForm role="schedule_officer" />
    </AuthShell>
  );
}
