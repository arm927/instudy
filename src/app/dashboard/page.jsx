
"use client";

import ReminderNotes from "../../components/Dashboard/Remindernotes";
import ProtectedRoute from "../../components/ProtectedRoute";
import "../../styles/reminder.css";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen p-8 dashboard-page">

        {/* WELCOME SECTION */}
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

        {/* REMINDER NOTES */}
        <ReminderNotes />

        {/* STUDY SETS - COMING NEXT */}
        <section className="studysets-section">
          <h2 className="text-2xl font-bold">
            My Study Sets ♡
          </h2>

          <p className="mt-2 text-gray-500">
            Your learning collections will appear here.
          </p>
        </section>

      </main>
    </ProtectedRoute>
  );
}
