
"use client";

import StudySetCard from "./studysetcard";

export default function StudySetGrid({
  studySets,
  onRename,
  onDelete,
}) {
  if (!studySets || studySets.length === 0) {
    return null;
  }

  return (
    <div className="studyset-grid">
      {studySets.map((studySet) => (
        <StudySetCard
          key={studySet.id}
          studySet={studySet}
          onRename={() => onRename(studySet)}
          onDelete={() => onDelete(studySet)}
        />
      ))}
    </div>
  );
}
