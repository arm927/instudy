import Link from "next/link";
import Login from "../../components/auth/Login";
import AuthRedirect from "../../components/AuthRedirect";

export default function LoginPage() {
  return (
    <AuthRedirect>
      <>
      <Login />
          <Link href="/forgot-password">Forgot password?</Link>
</>
    </AuthRedirect>
  );
}