
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function NotesManager({
  studySetId,
  sectionId,
  userId,
}) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // FETCH NOTES FOR THIS SECTION
  useEffect(() => {
    let isMounted = true;

    async function fetchNotes() {
      if (!studySetId || !sectionId || !userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .eq("folder_id", studySetId)
        .eq("section_id", sectionId)
        .order("updated_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Error fetching notes:", error);
        setError("Unable to load notes.");
      } else {
        setNotes(data || []);
      }

      setLoading(false);
    }

    fetchNotes();

    return () => {
      isMounted = false;
    };
  }, [studySetId, sectionId, userId]);

  // OPEN NEW NOTE EDITOR
  function handleNewNote() {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setError("");
  }

  // OPEN EXISTING NOTE
  function handleEditNote(note) {
    setEditingNote(note);
    setTitle(note.title || "");
    setContent(note.content || "");
    setError("");
  }

  // SAVE NOTE
  async function handleSaveNote(e) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a note title.");
      return;
    }

    if (saving) return;

    setSaving(true);
    setError("");

    const noteData = {
      user_id: userId,
      folder_id: studySetId,
      section_id: sectionId,
      title: title.trim(),
      content,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (editingNote) {
      result = await supabase
        .from("notes")
        .update(noteData)
        .eq("id", editingNote.id)
        .eq("user_id", userId)
        .eq("folder_id", studySetId)
        .eq("section_id", sectionId)
        .select()
        .single();
    } else {
      result = await supabase
        .from("notes")
        .insert(noteData)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error saving note:", result.error);
      setError("Unable to save your note. Please try again.");
    } else {
      setNotes((previous) => {
        const updated = previous.filter(
          (note) => note.id !== result.data.id
        );

        return [result.data, ...updated];
      });

      setEditingNote(null);
      setTitle("");
      setContent("");
    }

    setSaving(false);
  }

  // DELETE NOTE
  async function handleDeleteNote(note) {
    const confirmed = window.confirm(
      `Delete "${note.title}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", note.id)
      .eq("user_id", userId)
      .eq("folder_id", studySetId)
      .eq("section_id", sectionId);

    if (error) {
      console.error("Error deleting note:", error);
      setError("Unable to delete this note.");
      return;
    }

    setNotes((previous) =>
      previous.filter((item) => item.id !== note.id)
    );
  }

  return (
    <div className="notes-manager">

      {!editingNote && (
        <>
          <div className="notes-manager-header">
            <span>{notes.length} notes</span>

            <button
              type="button"
              onClick={handleNewNote}
              className="notes-add-button"
            >
              + Create Note
            </button>
          </div>

          {loading ? (
            <p className="notes-manager-message">
              Loading notes...
            </p>
          ) : notes.length === 0 ? (
            <div className="notes-manager-empty">
              <span>📝</span>
              <p>No notes in this section yet.</p>
              <small>Create your first note to get started!</small>
            </div>
          ) : (
            <div className="notes-list">
              {notes.map((note) => (
                <article className="notes-item" key={note.id}>
                  <button
                    type="button"
                    className="notes-item-content"
                    onClick={() => handleEditNote(note)}
                  >
                    <strong>{note.title}</strong>
                    <span>
                      {note.content?.trim() ||
                        "No content yet..."}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="notes-delete-button"
                    onClick={() => handleDeleteNote(note)}
                    aria-label={`Delete ${note.title}`}
                  >
                    ✕
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* NOTE EDITOR */}
      {editingNote !== undefined && (
        <form
          className="notes-editor"
          onSubmit={handleSaveNote}
        >
          <div className="notes-editor-header">
            <strong>
              {editingNote ? "Edit Note" : "Create Note"}
            </strong>

            <button
              type="button"
              onClick={() => setEditingNote(undefined)}
              disabled={saving}
            >
              ✕
            </button>
          </div>

          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            required
            disabled={saving}
          />

          <textarea
            placeholder="Start writing your notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            disabled={saving}
          />

          {error && (
            <p className="notes-manager-error" role="alert">
              {error}
            </p>
          )}

          <div className="notes-editor-actions">
            <button
              type="button"
              onClick={() => setEditingNote(undefined)}
              disabled={saving}
            >
              Cancel
            </button>

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      )}

      {error && !editingNote && (
        <p className="notes-manager-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
