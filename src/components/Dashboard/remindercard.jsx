"use client";

export default function ReminderCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleComplete,
  pinned,
}) {
  const colors = {
    pink: "#FCE9ED",
    lavender: "#F1EAF8",
    blue: "#E9EEF9",
    yellow: "#FFF1D9",
    green: "#E9F2ED",
  };

  const formattedDate = note.due_date
    ? new Date(
        `${note.due_date}T00:00:00`
      ).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const isOverdue =
    note.due_date &&
    note.due_date < new Date().toLocaleDateString("en-CA");

  return (
    <article
      className={`reminder-card ${
        note.is_completed ? "completed" : ""
      }`}
      style={{
        background: colors[note.color] || colors.pink,
      }}
    >
      <div className="reminder-card-top">
        <button
          type="button"
          className="reminder-pin-button"
          onClick={onTogglePin}
          title={pinned ? "Unpin reminder" : "Pin reminder"}
          aria-label={pinned ? "Unpin reminder" : "Pin reminder"}
        >
          {pinned ? "📌" : "📍"}
        </button>

        <div className="reminder-card-actions">
          <button onClick={onEdit} title="Edit reminder">
            ✎
          </button>

          <button
            onClick={onDelete}
            title="Delete reminder"
            className="reminder-delete-button"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="reminder-card-content">
        <h3>{note.title}</h3>

        {note.content && <p>{note.content}</p>}
      </div>

      {formattedDate && (
        <div
          className={`reminder-due-date ${
            isOverdue && !note.is_completed ? "overdue" : ""
          }`}
        >
          <span>📅</span>

          {isOverdue && !note.is_completed
            ? `Overdue · ${formattedDate}`
            : `Due ${formattedDate}`}
        </div>
      )}

      <div className="reminder-card-footer">
        <span className="reminder-created-date">
          {new Date(note.created_at).toLocaleDateString()}
        </span>

        <button
          className="reminder-complete-button"
          onClick={onToggleComplete}
        >
          {note.is_completed ? "↩ Reopen" : "✓ Complete"}
        </button>
      </div>
    </article>
  );
}