
"use client";

import ReminderNotes from "../../components/Dashboard/Remindernotes";
import DashboardHeader from "../../components/Dashboard/dashboardheader";
import ProtectedRoute from "../../components/ProtectedRoute";
import "../../styles/reminder.css";
import "../../styles/dashboard.css";

export default function DashboardPage() {
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

          <section className="studysets-section">
            <h2>My Study Sets ♡</h2>
            <p>Your learning collections will appear here.</p>
          </section>
        </main>
      </>
    </ProtectedRoute>
  );
}
