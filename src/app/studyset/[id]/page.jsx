
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import ProtectedRoute from "../../../components/ProtectedRoute";

import "../../../styles/studyset.css";

export default function StudySetPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [studySet, setStudySet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchStudySet() {
      if (!user || !id) return;

      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!isMounted) return;

      if (error) {
        console.error("Error fetching Study Set:", error);
        setError("We couldn't find this Study Set.");
      } else {
        setStudySet(data);
      }

      setLoading(false);
    }

    fetchStudySet();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  return (
    <ProtectedRoute>
      <main className="studyset-page">
        <button
          type="button"
          className="studyset-back-button"
          onClick={() => router.push("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        {loading && (
          <p className="studyset-loading">
            Loading your Study Set... 🌷
          </p>
        )}

        {!loading && error && (
          <div className="studyset-error">
            <p>{error}</p>
            <button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && studySet && (
          <>
            <header className="studyset-header">
              <div className="studyset-header-icon">
                {studySet.icon || "📚"}
              </div>

              <div>
                <p className="studyset-header-label">
                  YOUR STUDY SPACE
                </p>

                <h1>{studySet.name}</h1>

                <p>
                  {studySet.description ||
                    "Everything you need to learn, all in one place."}
                </p>
              </div>
            </header>

            <section className="studyset-content">
              <h2>Your Materials</h2>

              <p>
                Your notes, flashcards, and quizzes will live here.
              </p>
            </section>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
