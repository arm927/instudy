
import Register from "../../components/auth/Register";
import AuthRedirect from "../../components/AuthRedirect";

export default function RegisterPage() {
  return (
    <AuthRedirect>
      <Register />
    </AuthRedirect>
  );
}
