import { Typography } from "@mui/material";

import AuthShell from "@/components/auth/AuthShell";
import StudentLoginForm from "@/components/auth/StudentLoginForm";

export const metadata = {
  title: "Student sign in",
};

export default function StudentLoginPage() {
  return (
    <AuthShell
      title="Student sign in"
      subtitle="Use the roll number and name your school registered for you."
      footer={
        <Typography variant="body2" color="text.secondary" align="center">
          Forgotten your password? Ask your school office to reset it.
        </Typography>
      }
    >
      <StudentLoginForm />
    </AuthShell>
  );
}
