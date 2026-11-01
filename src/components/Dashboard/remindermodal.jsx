"use client";

import { useEffect, useState } from "react";

const initialValues = {
  title: "",
  content: "",
  color: "pink",
  due_date: "",
  is_pinned: false,
};

export default function ReminderModal({
  isOpen,
  onClose,
  onSave,
  editingReminder,
  busy,
}) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    if (isOpen) {
      setForm(
        editingReminder
          ? {
              title: editingReminder.title || "",
              content: editingReminder.content || "",
              color: editingReminder.color || "pink",
              due_date: editingReminder.due_date || "",
              is_pinned: editingReminder.is_pinned || false,
            }
          : initialValues
      );
    }
  }, [isOpen, editingReminder]);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) return;

    onSave({
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      due_date: form.due_date || null,
    });
  }

  return (
    <div className="reminder-modal-overlay" onClick={onClose}>
      <div
        className="reminder-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="reminder-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="reminder-modal-heading">
          <span className="reminder-modal-icon">📌</span>

          <h2>
            {editingReminder
              ? "Edit Reminder"
              : "Create Reminder"}
          </h2>

          <p>
            Keep important things close to your study space.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="reminder-title">Reminder Title</label>

          <input
            id="reminder-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Submit Biology assignment"
            maxLength={100}
            required
          />

          <label htmlFor="reminder-content">Description</label>

          <textarea
            id="reminder-content"
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Write something you don't want to forget..."
            rows={4}
          />

          <label htmlFor="reminder-due-date">
            Due Date <span>(Optional)</span>
          </label>

          <input
            id="reminder-due-date"
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
          />

          <p className="reminder-date-hint">
            Reminders with an upcoming due date are automatically
            pinned until the date passes.
          </p>

          <label>Sticky Note Color</label>

          <div className="reminder-color-options">
            {["pink", "lavender", "blue", "yellow", "green"].map(
              (color) => (
                <button
                  key={color}
                  type="button"
                  className={`reminder-color-option color-${color} ${
                    form.color === color ? "selected" : ""
                  }`}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, color }))
                  }
                  aria-label={`Choose ${color}`}
                  aria-pressed={form.color === color}
                />
              )
            )}
          </div>

          <label className="reminder-manual-pin">
            <input
              type="checkbox"
              name="is_pinned"
              checked={form.is_pinned}
              onChange={handleChange}
            />

            <span>Keep this reminder pinned manually</span>
          </label>

          <button
            type="submit"
            className="reminder-save-button"
            disabled={busy || !form.title.trim()}
          >
            {busy
              ? "Saving..."
              : editingReminder
                ? "Save Changes"
                : "Create Reminder"}
          </button>
        </form>
      </div>
    </div>
  );
}