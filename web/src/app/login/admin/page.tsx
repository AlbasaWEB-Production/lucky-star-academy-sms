import Link from "@/components/NextLink";
import { Typography } from "@mui/material";

import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Administrator sign in",
};

export default function AdminLoginPage() {
  return (
    <AuthShell
      title="Administrator sign in"
      subtitle="Welcome back. Please enter your details."
      footer={
        <Typography variant="body2" color="text.secondary" align="center">
          Don&apos;t have an account?{" "}
          <Link href="/register/school" style={{ color: "#7f56da", fontWeight: 600 }}>
            Register your school
          </Link>
        </Typography>
      }
    >
      <LoginForm role="admin" />
    </AuthShell>
  );
}
