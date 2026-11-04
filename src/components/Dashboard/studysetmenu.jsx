
"use client";

import { useState } from "react";

export default function StudySetMenu({
  onRename,
  onDelete,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="studyset-menu-wrapper">
      <button
        type="button"
        className="studyset-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Study Set options"
      >
        ⋯
      </button>

      {isOpen && (
        <>
          <div
            className="studyset-menu-backdrop"
            onClick={() => setIsOpen(false)}
          />

          <div className="studyset-menu-dropdown">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onRename?.();
              }}
            >
              ✎ Rename
            </button>

            <button
              type="button"
              className="delete-option"
              onClick={() => {
                setIsOpen(false);
                onDelete?.();
              }}
            >
              🗑 Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
