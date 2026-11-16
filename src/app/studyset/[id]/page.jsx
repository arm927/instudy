"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardHeader from "../../../components/Dashboard/dashboardheader";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import ProtectedRoute from "../../../components/ProtectedRoute";
import SectionManager from "../../../components/studyset/sectionmanager";

import "../../../styles/studyset.css";

function StudySetContent({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [studySet, setStudySet] = useState(null);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;

    let isMounted = true;

    async function fetchStudySetData() {
      try {
        const [studySetResult, sectionsResult] = await Promise.all([
          supabase
            .from("folders")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single(),

          supabase
            .from("studyset_sections")
            .select("*")
            .eq("studyset_id", id)
            .eq("user_id", user.id)
            .order("position", { ascending: true })
            .order("created_at", { ascending: true }),
        ]);

        if (!isMounted) return;

        if (studySetResult.error) {
          console.error("Error fetching Study Set:", studySetResult.error);
          setError("We couldn't find this Study Set.");
          return;
        }

        if (sectionsResult.error) {
          console.error("Error fetching sections:", sectionsResult.error);
          setError("Unable to load your sections.");
          return;
        }

        setStudySet(studySetResult.data);
        setSections(sectionsResult.data || []);
      } catch (err) {
        console.error("StudySet loading error:", err);
        if (isMounted) {
          setError("Unable to load this Study Set.");
        }
      }
    }

    fetchStudySetData();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  return (
    <ProtectedRoute>
      <>
        <DashboardHeader />

        <main className="studyset-page">
          <button
            type="button"
            className="studyset-back-button"
            onClick={() => router.push("/dashboard")}
          >
            ← Back to Dashboard
          </button>

          {error && (
            <div className="studyset-error">
              <p>{error}</p>
              <button type="button" onClick={() => router.push("/dashboard")}>
                Return to Dashboard
              </button>
            </div>
          )}

          {/* Always render the structure. Content appears when ready. */}
          {!error && (
            <>
              <header className="studyset-header">
                <div className="studyset-header-icon">
                  {studySet?.icon || "📚"}
                </div>

                <div>
                  <p className="studyset-header-label">YOUR STUDY SPACE</p>

                  <h1>{studySet?.name || "\u00A0"}</h1>

                  <p>
                    {studySet?.description ||
                      "Everything you need to learn, all in one place."}
                  </p>
                </div>
              </header>

              {studySet && (
                <SectionManager
                  studySetId={studySet.id}
                  userId={user.id}
                  initialSections={sections}
                />
              )}
            </>
          )}
        </main>
      </>
    </ProtectedRoute>
  );
}

export default function StudySetPage({ params }) {
  return (
    <Suspense fallback={null}>
      <StudySetContent params={params} />
    </Suspense>
  );
}