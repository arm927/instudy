
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

const icons = ["📚", "🌸", "🌷", "🪻", "🌿", "⭐", "🦋", "☁️"];

export default function CreateStudySetModal({
  isOpen,
  onClose,
  onCreated,
  onUpdated,
  editingSet = null,
}) {
  const { user } = useAuth();

const [name, setName] = useState(editingSet?.name || "");
const [selectedIcon, setSelectedIcon] = useState(
  editingSet?.icon || "📚"
);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

  const isEditing = Boolean(editingSet);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      setError("Please log in first.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a Study Set name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const values = {
        name: name.trim(),
        icon: selectedIcon,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { data, error } = await supabase
          .from("folders")
          .update(values)
          .eq("id", editingSet.id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        onUpdated?.(data);
      } else {
        const { data, error } = await supabase
          .from("folders")
          .insert({
            ...values,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        onCreated?.(data);
      }

      setName("");
      setSelectedIcon("📚");
      onClose();

    } catch (err) {
      setError(
        err.message ||
          `Unable to ${isEditing ? "update" : "create"} Study Set.`
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;

    setName("");
    setSelectedIcon("📚");
    setError("");
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <section
        className="studyset-modal create-studyset-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={handleClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="create-modal-icon">
          {isEditing ? "✎" : "✿"}
        </div>

        <h2>
          {isEditing ? "Edit Study Set" : "Create a Study Set"}
        </h2>

        <p>
          {isEditing
            ? "Give your Study Set a little makeover."
            : "A little space for everything you're learning."}
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="studyset-name">
            Study Set name
          </label>

          <input
            id="studyset-name"
            type="text"
            placeholder="e.g. Biology, Mathematics..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoFocus
            required
          />

          <label>Choose an icon</label>

          <div className="studyset-icon-picker">
            {icons.map((icon) => (
              <button
                key={icon}
                type="button"
                className={
                  selectedIcon === icon
                    ? "icon-option selected"
                    : "icon-option"
                }
                onClick={() => setSelectedIcon(icon)}
                aria-label={`Choose ${icon}`}
                aria-pressed={selectedIcon === icon}
              >
                {icon}
              </button>
            ))}
          </div>

          {error && (
            <p className="create-modal-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="modal-submit"
            disabled={loading}
          >
            {loading
              ? isEditing
                ? "Saving changes..."
                : "Creating..."
              : isEditing
                ? "Save Changes ♡"
                : "Create Study Set ♡"}
          </button>
        </form>
      </section>
    </div>
  );
}
