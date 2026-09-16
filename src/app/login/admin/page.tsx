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
    >
      <LoginForm role="admin" />
    </AuthShell>
  );
}
