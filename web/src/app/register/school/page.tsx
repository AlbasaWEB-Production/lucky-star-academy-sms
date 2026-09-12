import Link from "@/components/NextLink";
import { Typography } from "@mui/material";

import AuthShell from "@/components/auth/AuthShell";
import RegisterSchoolForm from "@/components/auth/RegisterSchoolForm";

export const metadata = {
  title: "Register your school",
};

export default function RegisterSchoolPage() {
  return (
    <AuthShell
      title="Register your school"
      subtitle="Create your school's account. You will be its first administrator and can add teachers and students next."
      footer={
        <Typography variant="body2" color="text.secondary" align="center">
          Already registered?{" "}
          <Link href="/login/admin" style={{ color: "#7f56da", fontWeight: 600 }}>
            Sign in
          </Link>
        </Typography>
      }
    >
      <RegisterSchoolForm />
    </AuthShell>
  );
}
