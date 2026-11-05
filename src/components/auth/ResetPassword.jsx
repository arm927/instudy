
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !session) {
        setError(
          "Your reset link is invalid or expired. Please request a new one."
        );
      } else {
        setValidSession(true);
      }

      setCheckingSession(false);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      await supabase.auth.signOut();

      setMessage("Password updated successfully! You can now log in.");
      setPassword("");
      setConfirmPassword("");
      setValidSession(false);
    } catch (err) {
      setError(err.message || "Unable to update password.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p>Verifying your recovery link...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Reset password</h1>
        <p>Create a new password for your account.</p>

        {validSession ? (
          <form onSubmit={handleReset}>
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />

            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            {error && <p role="alert">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        ) : (
          <>
            {error && <p role="alert">{error}</p>}
            {message && <p role="status">{message}</p>}

            {!message && (
              <p>
                <Link href="/forgot-password">
                  Request a new recovery link
                </Link>
              </p>
            )}
          </>
        )}

        <Link href="/login">Back to login</Link>
      </section>
    </main>
  );
}
