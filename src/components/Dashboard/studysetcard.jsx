
"use client";

import Link from "next/link";
import StudySetMenu from "./studysetmenu";

export default function StudySetCard({
  studySet,
  onRename,
  onDelete,
}) {
  return (
    <div className="studyset-card">
      <div className="studyset-card-top">
        <Link
          href={`/studyset/${studySet.id}`}
          className="studyset-card-link"
        >
          <div className="studyset-card-icon">
            {studySet.icon || "📚"}
          </div>

          <div className="studyset-card-info">
            <h3>{studySet.name}</h3>

            <p>
              {studySet.description || "No description yet"}
            </p>
          </div>
        </Link>

        <StudySetMenu
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
