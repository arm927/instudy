
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "../../../styles/studyset.css";
import { supabase } from "../../../lib/supabase";

function StudySetContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [studySet, setStudySet] = useState(null);
  const [counts, setCounts] = useState({
    flashcards: 0,
    quizzes: 0,
    notes: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    async function fetchStudySet() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("study_sets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setError(
          "Study Set not found or you don't have permission to access it."
        );
        setLoading(false);
        return;
      }

      setStudySet(data);

      const [flashcards, quizzes, notes] = await Promise.all([
        supabase
          .from("flashcards")
          .select("id", { count: "exact", head: true })
          .eq("study_set_id", id),

        supabase
          .from("quizzes")
          .select("id", { count: "exact", head: true })
          .eq("study_set_id", id),

        supabase
          .from("notes")
          .select("id", { count: "exact", head: true })
          .eq("study_set_id", id),
      ]);

      setCounts({
        flashcards: flashcards.count ?? 0,
        quizzes: quizzes.count ?? 0,
        notes: notes.count ?? 0,
      });

      setLoading(false);
    }

    fetchStudySet();
  }, [id]);

  if (loading) {
    return (
      <main className="studyset-page">
        <p>Loading your Study Set...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="studyset-page">
        <button onClick={() => router.push("/dashboard")}>
          ← Back to Dashboard
        </button>

        <h2>Oops!</h2>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="studyset-page">
      <header className="studyset-header">
        <Link href="/dashboard" className="back-link">
          ← Back to Study Sets
        </Link>

        <div className="studyset-heading">
          <div>
            <h1>{studySet.title}</h1>

            <p>
              {studySet.description ||
                "Your personal learning workspace."}
            </p>
          </div>

          <button className="more-button" aria-label="More options">
            ⋯
          </button>
        </div>
      </header>

      <section className="studyset-materials">
        <h2>Your Learning Materials</h2>

        <div className="material-grid">
          <div className="material-card flashcard-card">
            <span className="material-icon">▤</span>
            <h3>Flashcards</h3>
            <p>{counts.flashcards} flashcards</p>
          </div>

          <div className="material-card quiz-card">
            <span className="material-icon">☷</span>
            <h3>Quizzes</h3>
            <p>{counts.quizzes} quizzes</p>
          </div>

          <div className="material-card notes-card">
            <span className="material-icon">✎</span>
            <h3>Notes</h3>
            <p>{counts.notes} notes</p>
          </div>
        </div>
      </section>

      <section className="studyset-info">
        <h2>About this Study Set</h2>

        <p>
          Created:{" "}
          {studySet.created_at
            ? new Date(studySet.created_at).toLocaleDateString()
            : "Unknown"}
        </p>
      </section>
    </main>
  );
}

export default function StudySetPage() {
  return (
    <Suspense fallback={<div>Loading study set...</div>}>
      <StudySetContent />
    </Suspense>
  );
}
