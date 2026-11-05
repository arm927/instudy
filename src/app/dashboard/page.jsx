
"use client";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

import CreateStudySetModal from "../../components/Dashboard/createstudysetmodal";
import DeleteStudySetModal from "../../components/Dashboard/deletestudysetmodal";
import StudySetGrid from "../../components/Dashboard/studysetgrid";
import ReminderNotes from "../../components/Dashboard/Remindernotes";
import DashboardHeader from "../../components/Dashboard/dashboardheader";
import ProtectedRoute from "../../components/ProtectedRoute";

import "../../styles/reminder.css";
import "../../styles/dashboard.css";

export default function DashboardPage() {
  const { user } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [deletingSet, setDeletingSet] = useState(null);

  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH EXISTING STUDY SETS
  useEffect(() => {
    let isMounted = true;

    async function fetchStudySets() {
      if (!user) {
        setStudySets([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id);

      if (!isMounted) return;

      if (error) {
        console.error("Error fetching Study Sets:", error.message);
        setError("Unable to load your Study Sets. Please try again.");
      } else {
        setStudySets(data || []);
      }

      setLoading(false);
    }

    fetchStudySets();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // CREATE A STUDY SET
  function handleStudySetCreated(newSet) {
    setStudySets((current) => [
      newSet,
      ...current.filter((set) => set.id !== newSet.id),
    ]);
  }

  // OPEN RENAME MODAL
  function handleRename(set) {
    setEditingSet(set);
    setCreateOpen(true);
  }

  // UPDATE A STUDY SET
  function handleStudySetUpdated(updatedSet) {
    setStudySets((current) =>
      current.map((set) =>
        set.id === updatedSet.id ? updatedSet : set
      )
    );

    setEditingSet(null);
  }

  // CLOSE CREATE OR RENAME MODAL
  function handleCloseCreateModal() {
    setCreateOpen(false);
    setEditingSet(null);
  }

  // REMOVE DELETED STUDY SET FROM DASHBOARD
  function handleStudySetDeleted(deletedId) {
    setStudySets((current) =>
      current.filter((set) => set.id !== deletedId)
    );

    setDeletingSet(null);
  }

  return (
    <ProtectedRoute>
      <>
        <DashboardHeader />

        <main className="min-h-screen p-8 dashboard-page">
          <section className="welcome-section">
            <p className="welcome-label">
              YOUR PERSONAL STUDY SPACE
            </p>

            <h1 className="text-3xl font-bold">
              Hello, learner! ✨
            </h1>

            <p className="mt-2 text-gray-500">
              Organize your thoughts, one reminder at a time.
            </p>
          </section>

          <ReminderNotes />

          {/* STUDY SETS */}
          <section className="studysets-section">
            <div className="studysets-heading">
              <div>
                <h2>My Study Sets ♡</h2>
                <p>Your little collections of knowledge.</p>
              </div>

              <button
                type="button"
                className="create-studyset-button"
                onClick={() => {
                  setEditingSet(null);
                  setCreateOpen(true);
                }}
              >
                <span>+</span> Create Study Set
              </button>
            </div>

            {/* LOADING */}
            {loading && (
              <div className="empty-studysets">
                <p>Loading your Study Sets... 🌷</p>
              </div>
            )}

            {/* ERROR */}
            {!loading && error && (
              <div className="empty-studysets">
                <p role="alert">{error}</p>
              </div>
            )}

            {/* STUDY SET GRID */}
            {!loading && !error && studySets.length > 0 && (
              <StudySetGrid
                studySets={studySets}
                onRename={handleRename}
                onDelete={(set) => setDeletingSet(set)}
              />
            )}

            {/* EMPTY STATE */}
            {!loading && !error && studySets.length === 0 && (
              <div className="empty-studysets">
                <div className="empty-icon">📚</div>

                <h3>Your library is waiting!</h3>

                <p>
                  Create your first Study Set and start
                  organizing your learning materials.
                </p>

                <button
                  type="button"
                  className="create-studyset-button"
                  onClick={() => {
                    setEditingSet(null);
                    setCreateOpen(true);
                  }}
                >
                  + Create your first Study Set
                </button>
              </div>
            )}
          </section>
        </main>

        {/* CREATE / RENAME STUDY SET MODAL */}
        <CreateStudySetModal
          isOpen={createOpen}
          onClose={handleCloseCreateModal}
          onCreated={handleStudySetCreated}
          onUpdated={handleStudySetUpdated}
          editingSet={editingSet}
        />

        {/* DELETE STUDY SET MODAL */}
        <DeleteStudySetModal
          isOpen={!!deletingSet}
          onClose={() => setDeletingSet(null)}
          studySet={deletingSet}
          onDeleted={handleStudySetDeleted}
        />
      </>
    </ProtectedRoute>
  );
}
