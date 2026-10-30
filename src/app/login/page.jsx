import Login from "../../components/auth/Login";
import AuthRedirect from "../../components/AuthRedirect";

export default function LoginPage() {
  return (
    <AuthRedirect>
      <Login />
    </AuthRedirect>
  );
}