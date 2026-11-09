"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import FileUpload from "./fileupload";
import NotesManager from "./notesmanager";

export default function SectionManager({
  studySetId,
  userId,
  initialSections = [],
}) {
  const [sections, setSections] = useState(initialSections);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({});

  async function handleCreateSection(e) {
    e.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle || !studySetId || !userId) return;

    setCreating(true);
    setError("");

    const { data, error } = await supabase
      .from("studyset_sections")
      .insert({
        studyset_id: studySetId,
        user_id: userId,
        title: trimmedTitle,
        position: sections.length,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setError("Unable to create this section.");
    } else {
      setSections((previous) => [...previous, data]);

      setExpandedSections((previous) => ({
        ...previous,
        [data.id]: true,
      }));

      setTitle("");
    }

    setCreating(false);
  }

  async function handleDeleteSection(section) {
    const confirmed = window.confirm(
      `Delete "${section.title}"? Its files will become unassigned.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("studyset_sections")
      .delete()
      .eq("id", section.id)
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      setError("Unable to delete this section.");
      return;
    }

    setSections((previous) =>
      previous.filter((item) => item.id !== section.id)
    );
  }

  function toggleSection(id) {
    setExpandedSections((previous) => {
      // Default to true if undefined, then invert
      const currentState = previous[id] ?? true;
      return {
        ...previous,
        [id]: !currentState,
      };
    });
  }

  return (
    <section className="section-manager">
      <div className="section-manager-header">
        <div>
          <h2>My Learning Sections</h2>
          <p>
            Organize lecture notes, practice flashcards, quizzes, and reference
            files by weekly modules.
          </p>
        </div>

        <span className="section-count">{sections.length} sections</span>
      </div>

      <form className="create-section-form" onSubmit={handleCreateSection}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Week 1 — HTML & Web Fundamentals"
          maxLength={100}
          disabled={creating}
        />

        <button type="submit" disabled={creating || !title.trim()}>
          {creating ? "Creating..." : "+ Create Section"}
        </button>
      </form>

      {error && (
        <p className="section-error" role="alert">
          {error}
        </p>
      )}

      {sections.length === 0 ? (
        <div className="empty-sections">
          <span>📁</span>
          <h3>No sections yet</h3>
          <p>Create your first section to organize your materials.</p>
        </div>
      ) : (
        <div className="learning-section-list">
          {sections.map((section, index) => {
            const isExpanded = expandedSections[section.id] ?? true;

            return (
              <article className="learning-section-card" key={section.id}>
                <header className="learning-section-card-header">
                  <div className="learning-section-title">
                    <span className="section-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div>
                      <h3>{section.title}</h3>
                      <p>📚 Learning section</p>
                    </div>
                  </div>

                  <div className="section-actions">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                    >
                      {isExpanded ? "Collapse" : "Expand"}
                    </button>

                    <button
                      type="button"
                      className="section-delete-button"
                      onClick={() => handleDeleteSection(section)}
                      aria-label={`Delete ${section.title}`}
                    >
                      ✕
                    </button>
                  </div>
                </header>

                {isExpanded && (
                  <div className="learning-section-content">
                    <div className="learning-panel notes-panel">
                      <h4>📝 Notes</h4>
                      <NotesManager
                        studySetId={studySetId}
                        sectionId={section.id}
                        userId={userId}
                      />
                    </div>

                    <div className="learning-panel">
                      <h4>🪄 Flashcards</h4>
                      <p>Your flashcard decks will appear here.</p>
                      <button type="button" disabled>
                        + Add Cards
                      </button>
                    </div>

                    <div className="learning-panel">
                      <h4>🧩 Quizzes</h4>
                      <p>Your quizzes will appear here.</p>
                      <button type="button" disabled>
                        + Add Quiz
                      </button>
                    </div>

                    <div className="learning-panel materials-panel">
                      <h4>📁 Materials</h4>
                      <FileUpload
                        studySetId={studySetId}
                        userId={userId}
                        sectionId={section.id}
                      />
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}