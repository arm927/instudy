"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";

import { supabase } from "../../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import "../../../../../styles/viewer.css";

const PDFDocument = dynamic(() => import("./pdfdocument"), {
  ssr: false,
  loading: () => null,
});

const BUCKET = "studyset-files";

function PDFViewerContent() {
  const pathname = usePathname();
  const match = (pathname || "").match(
    /\/studyset\/([^/]+)\/viewer\/([^/?#]+)/
  );
  const id = match?.[1];
  const fileId = match?.[2];

  const router = useRouter();
  const { user } = useAuth();

  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");
  const [loadProgress, setLoadProgress] = useState(0);

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Split view
  const [splitMode, setSplitMode] = useState(false);

  // Notes (simple for now – you can later load/save from Supabase)
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user || !id || !fileId) return;

    let active = true;

    async function loadPDF() {
      setError("");

      try {
        const cacheKey = `instudy-pdf:${fileId}`;
        try {
          const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
          if (cached && cached.exp > Date.now()) {
            if (!active) return;
            setFile(cached.file);
            setPdfUrl(cached.url);
            return;
          }
        } catch {}

        const { data: fileData, error: fileError } = await supabase
          .from("studyset_files")
          .select("*")
          .eq("id", fileId)
          .eq("studyset_id", id)
          .eq("user_id", user.id)
          .single();

        if (fileError) throw fileError;

        if (fileData.file_type?.toLowerCase() !== "pdf") {
          throw new Error("This file is not a PDF document.");
        }

        const { data: signedData, error: signError } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(fileData.file_path, 3600);

        if (signError) throw signError;
        if (!active) return;

        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              file: fileData,
              url: signedData.signedUrl,
              exp: Date.now() + 50 * 60 * 1000,
            })
          );
        } catch {}

        setFile(fileData);
        setPdfUrl(signedData.signedUrl);
      } catch (err) {
        console.error("PDF loading error:", err);
        if (active) {
          setError(err.message || "Unable to load document.");
        }
      }
    }

    loadPDF();

    return () => {
      active = false;
    };
  }, [user, id, fileId]);

  function handlePDFLoad({ numPages: total }) {
    setNumPages(total);
    setLoadProgress(100);

    if (!hasLoadedOnce) {
      setPageNumber(1);
      setHasLoadedOnce(true);
    }
  }

  const handlePageChange = useCallback((page) => {
    setPageNumber(page);
  }, []);

  function changeZoom(amount) {
    setZoom((prev) => Math.min(2, Math.max(0.5, +(prev + amount).toFixed(1))));
  }

  return (
    <ProtectedRoute>
      <main className={`pdf-viewer-page ${splitMode ? "split-mode" : ""}`}>
        <header className="pdf-viewer-header">
          <button type="button" onClick={() => router.back()}>
            ← Back
          </button>

          <div className="pdf-viewer-title">
            {file?.file_name || "PDF Viewer"}
          </div>

          <div className="pdf-viewer-header-actions">
            <button
              type="button"
              className={`split-toggle ${splitMode ? "active" : ""}`}
              onClick={() => setSplitMode((v) => !v)}
            >
              {splitMode ? "Close Notes" : "Split View"}
            </button>
            <span className="pdf-viewer-brand">InStudy</span>
          </div>
        </header>

        <nav className="pdf-toolbar">
          <div className="pdf-page-controls">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>

            <span>
              {pageNumber} / {numPages || "—"}
            </span>

            <button
              type="button"
              disabled={!numPages || pageNumber >= numPages}
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            >
              Next
            </button>
          </div>

          <div className="pdf-zoom-controls">
            <button type="button" onClick={() => changeZoom(-0.1)}>
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => changeZoom(0.1)}>
              +
            </button>
          </div>
        </nav>

        <div className="viewer-layout">
          {/* PDF side – always mounted */}
          <section className="pdf-document-area">
            {error && (
              <div className="pdf-error">
                <h2>Unable to open document</h2>
                <p>{error}</p>
                <button type="button" onClick={() => router.back()}>
                  Go Back
                </button>
              </div>
            )}

            {!error && pdfUrl && (
              <>
                {loadProgress > 0 && loadProgress < 100 && (
                  <p className="pdf-loading-progress">
                    Downloading document: {loadProgress}%
                  </p>
                )}

                <PDFDocument
                  pdfUrl={pdfUrl}
                  pageNumber={pageNumber}
                  zoom={zoom}
                  numPages={numPages}
                  onLoadSuccess={handlePDFLoad}
                  onLoadProgress={({ loaded, total }) => {
                    if (total) {
                      setLoadProgress(Math.round((loaded / total) * 100));
                    }
                  }}
                  onLoadError={(err) => {
                    console.error("PDF rendering error:", err);
                    setError("Unable to render this PDF.");
                  }}
                  onPageChange={handlePageChange}
                />
              </>
            )}

            {!error && !pdfUrl && (
              <p className="pdf-preparing">Preparing document…</p>
            )}
          </section>

          {/* Notes side – only mounted when split is active */}
          {splitMode && (
            <aside className="notes-panel">
              <div className="notes-header">
                <h3>Notes</h3>
              </div>
              <NotesEditor
                initialValue={notes}
                onChange={setNotes}
              />
            </aside>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

// Isolated notes component – typing here never touches the PDF
function NotesEditor({ initialValue = "", onChange }) {
  const [value, setValue] = useState(initialValue);

  // Keep local state in sync if parent ever changes the value
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e) => {
    const next = e.target.value;
    setValue(next);
    onChange?.(next);
  };

  return (
    <textarea
      className="notes-textarea"
      value={value}
      onChange={handleChange}
      placeholder="Write notes for this document…"
      spellCheck={true}
    />
  );
}

export default function PDFViewerPage() {
  return (
    <Suspense
      fallback={
        <main className="pdf-viewer-page">
          <p className="pdf-preparing">Preparing viewer…</p>
        </main>
      }
    >
      <PDFViewerContent />
    </Suspense>
  );
}