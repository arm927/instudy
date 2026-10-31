
"use client";

import ProtectedRoute from "../../components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen p-8">
        <h1 className="text-2xl font-bold">
          Welcome to Instudy!
        </h1>

        <p className="mt-2 text-gray-500">
          Your study space is ready.
        </p>
      </main>
    </ProtectedRoute>
  );
}
