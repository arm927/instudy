"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import ReminderCard from "./remindercard";
import ReminderModal from "./remindermodal";

export default function ReminderNotes() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  const [message, setMessage] = useState("");

  // Get today's date in local YYYY-MM-DD format.
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  // Determine effective pin status.
  function isPinned(note) {
    if (note.is_completed) return false;

    const automaticallyPinned =
      note.due_date && note.due_date >= todayString;

    return Boolean(note.is_pinned || automaticallyPinned);
  }

  // Fetch reminders
  const fetchReminders = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("reminder_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch reminders:", error);
      setMessage("Unable to load your reminders.");
      return;
    }

    setNotes(data || []);
  }, []);

  // Initialize
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !user) {
        setMessage("Please log in to access your reminders.");
        setLoading(false);
        return;
      }

      setUser(user);
      await fetchReminders(user.id);

      if (mounted) setLoading(false);
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [fetchReminders]);

  // Open create modal
  function openCreateModal() {
    setEditingReminder(null);
    setModalOpen(true);
    setMessage("");
  }

  // Open edit modal
  function openEditModal(note) {
    setEditingReminder(note);
    setModalOpen(true);
    setMessage("");
  }

  // Create or update
  async function saveReminder(values) {
    if (!user) return;

    setBusy(true);
    setMessage("");

    const payload = {
      title: values.title,
      content: values.content,
      color: values.color,
      due_date: values.due_date,
      is_pinned: values.is_pinned,
    };

    let error;

    if (editingReminder) {
      const result = await supabase
        .from("reminder_notes")
        .update(payload)
        .eq("id", editingReminder.id)
        .eq("user_id", user.id);

      error = result.error;
    } else {
      const result = await supabase
        .from("reminder_notes")
        .insert({
          ...payload,
          user_id: user.id,
        });

      error = result.error;
    }

    if (error) {
      console.error("Save reminder:", error);
      setMessage("Couldn't save your reminder.");
    } else {
      await fetchReminders(user.id);
      setModalOpen(false);
      setEditingReminder(null);
    }

    setBusy(false);
  }

  // Delete
  async function deleteReminder(note) {
    const confirmed = window.confirm(
      `Delete "${note.title}"? This cannot be undone.`
    );

    if (!confirmed || !user) return;

    const { error } = await supabase
      .from("reminder_notes")
      .delete()
      .eq("id", note.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete reminder:", error);
      setMessage("Couldn't delete this reminder.");
      return;
    }

    setNotes((prev) =>
      prev.filter((item) => item.id !== note.id)
    );
  }

  // Manual pin / unpin
  async function togglePin(note) {
    if (!user || note.is_completed) return;

    const { error } = await supabase
      .from("reminder_notes")
      .update({ is_pinned: !note.is_pinned })
      .eq("id", note.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Toggle pin:", error);
      setMessage("Couldn't update the pin.");
      return;
    }

    setNotes((prev) =>
      prev.map((item) =>
        item.id === note.id
          ? { ...item, is_pinned: !note.is_pinned }
          : item
      )
    );
  }

  // Complete / reopen
  async function toggleComplete(note) {
    if (!user) return;

    const { error } = await supabase
      .from("reminder_notes")
      .update({ is_completed: !note.is_completed })
      .eq("id", note.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Toggle completion:", error);
      setMessage("Couldn't update the reminder.");
      return;
    }

    setNotes((prev) =>
      prev.map((item) =>
        item.id === note.id
          ? { ...item, is_completed: !note.is_completed }
          : item
      )
    );
  }

  // Filter reminders
  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        (note.content || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      if (filter === "completed") {
        return matchesSearch && note.is_completed;
      }

      if (filter === "active") {
        return matchesSearch && !note.is_completed;
      }

      return matchesSearch;
    })
    .sort((a, b) => {
      if (filter === "all") {
        const pinnedDifference =
          Number(isPinned(b)) - Number(isPinned(a));

        if (pinnedDifference !== 0) return pinnedDifference;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

  if (loading) {
    return (
      <section className="reminder-section">
        <p>Loading your reminders...</p>
      </section>
    );
  }

  return (
    <section className="reminder-section">

      {/* Heading */}
      <div className="reminder-section-heading">
        <div>
          <h2>My Reminder Notes ♡</h2>
          <p>A little space for things you don't want to forget.</p>
        </div>

        <button
          className="add-reminder-button"
          onClick={openCreateModal}
        >
          + Add Reminder
        </button>
      </div>

      {message && (
        <div className="reminder-message">
          {message}
        </div>
      )}

      {/* Search and filters */}
      <div className="reminder-toolbar">
        <input
          type="search"
          placeholder="Search reminders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All reminders</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Cards */}
      {filteredNotes.length > 0 ? (
        <div className="reminder-grid">
          {filteredNotes.map((note) => (
            <ReminderCard
              key={note.id}
              note={note}
              pinned={isPinned(note)}
              onEdit={() => openEditModal(note)}
              onDelete={() => deleteReminder(note)}
              onTogglePin={() => togglePin(note)}
              onToggleComplete={() => toggleComplete(note)}
            />
          ))}
        </div>
      ) : (
        <div className="reminder-empty-state">
          <span>🌷</span>

          <h3>
            {search
              ? "No reminders found"
              : filter === "completed"
                ? "Nothing completed yet"
                : "Your reminder space is waiting!"}
          </h3>

          <p>
            {search
              ? "Try searching for another reminder."
              : "Add a little reminder to keep important things in mind."}
          </p>

          {!search && filter === "all" && (
            <button
              className="add-reminder-button"
              onClick={openCreateModal}
            >
              + Create your first reminder
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <ReminderModal
        isOpen={modalOpen}
        onClose={() => {
          if (!busy) {
            setModalOpen(false);
            setEditingReminder(null);
          }
        }}
        onSave={saveReminder}
        editingReminder={editingReminder}
        busy={busy}
      />

    </section>
  );
}