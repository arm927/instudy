
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function DeleteStudySetModal({
  isOpen,
  onClose,
  studySet,
  onDeleted,
}) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!user || !studySet) return;

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("folders")
        .delete()
        .eq("id", studySet.id)
        .eq("user_id", user.id)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Study Set not found or you don't have permission to delete it."
        );
      }

      onDeleted?.(studySet.id);
      onClose();
    } catch (err) {
      setError(err.message || "Unable to delete Study Set.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !studySet) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="studyset-modal delete-studyset-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>

        <div className="create-modal-icon">🗑️</div>

        <h2>Delete Study Set?</h2>

        <p>
          Are you sure you want to delete{" "}
          <strong>{studySet.name}</strong>?
        </p>

        <p>
          This action cannot be undone.
        </p>

        {error && (
          <p className="create-modal-error" role="alert">
            {error}
          </p>
        )}

        <div className="delete-modal-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="delete-confirm-button"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </section>
    </div>
  );
}
