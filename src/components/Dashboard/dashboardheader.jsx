
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

export default function DashboardHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    setLoggingOut(true);

    try {
      await signOut();
      router.replace("/login");
    } catch (err) {
      setError(err.message || "Unable to log out.");
      setLoggingOut(false);
    }
  }

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Learner";

  return (
    <header className="dashboard-header">
      <Link href="/dashboard" className="dashboard-logo">
        InStudy<span>♡</span>
      </Link>

      <div className="dashboard-header-right">
        <div className="dashboard-user">
          <span className="dashboard-user-icon">
            {displayName.charAt(0).toUpperCase()}
          </span>

          <span className="dashboard-user-name">
            {displayName}
          </span>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>

      {error && (
        <p className="logout-error" role="alert">
          {error}
        </p>
      )}
    </header>
  );
}
