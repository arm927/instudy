"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

const BUCKET = "studyset-files";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "txt",
];

export default function FileUpload({ studySetId, userId, sectionId = null }) {
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");


  // Fetch existing files scoped to study set and section
  useEffect(() => {
    if (!studySetId || !userId) return;

    let active = true;

    async function fetchFiles() {
      setLoading(true);
      setError("");

      let query = supabase
        .from("studyset_files")
        .select("*")
        .eq("studyset_id", studySetId)
        .eq("user_id", userId);

      if (sectionId) {
        query = query.eq("section_id", sectionId);
      } else {
        query = query.is("section_id", null);
      }

      const { data, error: fetchError } = await query.order("created_at", {
        ascending: false,
      });

      if (!active) return;

      if (fetchError) {
        console.error("Fetch files error:", fetchError);
        setError("Unable to load your files.");
      } else {
        setFiles(data || []);
      }

      setLoading(false);
    }

    fetchFiles();

    return () => {
      active = false;
    };
  }, [studySetId, userId, sectionId]);

  // Validate and upload files
  async function handleUpload(selectedFiles) {
    if (!selectedFiles?.length || uploading) return;

    if (!studySetId || !userId) {
      setError("Missing StudySet or user information.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      for (const file of Array.from(selectedFiles)) {
        const extension = file.name.split(".").pop()?.toLowerCase();

        if (!ALLOWED_EXTENSIONS.includes(extension)) {
          throw new Error(
            `${file.name}: This file format is not supported.`
          );
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `${file.name}: File size must not exceed 20 MB.`
          );
        }

        if (file.size === 0) {
          throw new Error(`${file.name}: Empty files are not allowed.`);
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${userId}/${studySetId}/${crypto.randomUUID()}-${safeName}`;

        // Upload actual file
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, file, {
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Save file information with section association
        const { data, error: insertError } = await supabase
          .from("studyset_files")
          .insert({
            studyset_id: studySetId,
            user_id: userId,
            section_id: sectionId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: extension,
          })
          .select()
          .single();

        if (insertError) {
          await supabase.storage
            .from(BUCKET)
            .remove([filePath]);

          throw insertError;
        }

        setFiles((previous) => [data, ...previous]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Something went wrong during upload.");
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  // Open a file using a temporary signed URL
  async function handleOpen(file) {
    const { data, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.file_path, 60);

    if (signError) {
      setError(`Unable to open file: ${signError.message}`);
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  // Delete file
  async function handleDelete(file) {
    const confirmed = window.confirm(
      `Delete "${file.file_name}"?`
    );

    if (!confirmed) return;

    setError("");

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([file.file_path]);

    if (storageError) {
      console.error(storageError);
      setError("Unable to delete the stored file.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("studyset_files")
      .delete()
      .eq("id", file.id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error(deleteError);
      setError("File removed from storage, but its record could not be deleted.");
      return;
    }

    setFiles((previous) =>
      previous.filter((item) => item.id !== file.id)
    );
  }

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <section className="studyset-content file-upload-section">
      <div className="file-section-header">
        <div>
          <h2>Learning Materials</h2>
          <p>Keep all your study resources in one place.</p>
        </div>

        <span className="file-count">
          {files.length} {files.length === 1 ? "file" : "files"}
        </span>
      </div>


{/* Compact Upload Button */}
<div className="material-upload-action">
  <button
    type="button"
    className="material-upload-button"
    onClick={() => inputRef.current?.click()}
    disabled={uploading}
  >
    {uploading ? "Uploading..." : "＋ Upload Material"}
  </button>

  <input
    ref={inputRef}
    type="file"
    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
    multiple
    hidden
    onChange={(e) => handleUpload(e.target.files)}
  />
</div>


      {uploading && (
        <p className="upload-status">Uploading your files...</p>
      )}

      {error && (
        <p className="file-upload-error" role="alert">
          {error}
        </p>
      )}

      {/* Uploaded Files */}
      <div className="uploaded-files">
        <h3>Uploaded Files</h3>

        {loading ? (
          <p>Loading files...</p>
        ) : files.length === 0 ? (
          <div className="empty-files">
            <span>📂</span>
            <p>No files uploaded yet.</p>
          </div>
        ) : (
          <div className="file-list">
            {files.map((file) => (
              <div className="uploaded-file" key={file.id}>
                <div className="file-icon">
                  📄
                </div>

                <div className="file-details">
                  <strong title={file.file_name}>
                    {file.file_name}
                  </strong>

                  <span>
                    {file.file_type?.toUpperCase()} ·{" "}
                    {formatSize(file.file_size)}
                  </span>
                </div>

                <button
                  type="button"
                  className="file-open-button"
                  onClick={() => handleOpen(file)}
                  aria-label={`Open ${file.file_name}`}
                >
                  Open
                </button>

                <button
                  type="button"
                  className="file-delete-button"
                  onClick={() => handleDelete(file)}
                  aria-label={`Delete ${file.file_name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}