import { Typography } from "@mui/material";

import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Teacher sign in",
};

export default function TeacherLoginPage() {
  return (
    <AuthShell
      title="Teacher sign in"
      subtitle="Welcome back. Please enter your details."
      footer={
        <Typography variant="body2" color="text.secondary" align="center">
          Teacher accounts are created by your school administrator.
        </Typography>
      }
    >
      <LoginForm role="teacher" />
    </AuthShell>
  );
}
