import { Typography } from "@mui/material";

import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Accountant sign in",
};

export default function AccountantLoginPage() {
  return (
    <AuthShell
      title="Accountant sign in"
      subtitle="Welcome back. Please enter your details."
      footer={
        <Typography variant="body2" color="text.secondary" align="center">
          Accountant accounts are created by your school administrator.
        </Typography>
      }
    >
      <LoginForm role="accountant" />
    </AuthShell>
  );
}
