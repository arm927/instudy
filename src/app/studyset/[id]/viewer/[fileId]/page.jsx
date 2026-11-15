"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";

import { supabase } from "../../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";
import ProtectedRoute from "../../../../../components/ProtectedRoute";

const PDFDocument = dynamic(
  () => import("./pdfdocument"),
  {
    ssr: false,
    loading: () => <p>Preparing PDF viewer...</p>,
  }
);

const BUCKET = "studyset-files";

function PDFViewerContent({ params }) {
  // Read ids from the URL itself (/studyset/<id>/viewer/<fileId>) so this
  // works no matter what the dynamic folder is named.
  const pathname = usePathname();
  const parts = (pathname || "").split("/").filter(Boolean);
  const id = parts[1];
  const fileId = parts[3];

  const router = useRouter();
  const { user } = useAuth();

  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [loadProgress, setLoadProgress] = useState(0);

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!user || !id || !fileId) return;

    let active = true;

    async function loadPDF() {
      setLoading(true);
      setError("");

      try {
        // Reuse a recent signed URL so re-opening a PDF is instant.
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

        const { data: fileData, error: fileError } =
          await supabase
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

        const { data: signedData, error: signError } =
          await supabase.storage
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
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPDF();

    return () => {
      active = false;
    };
  }, [user, id, fileId]);

  function handlePDFLoad({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changeZoom(amount) {
    setZoom((previous) =>
      Math.min(2, Math.max(0.5, previous + amount))
    );
  }

  return (
    <ProtectedRoute>
      <main className="pdf-viewer-page">

        <header className="pdf-viewer-header">
          <button
            type="button"
            onClick={() => router.back()}
          >
            ← Back
          </button>

          <div className="pdf-viewer-title">
            {file?.file_name || "PDF Viewer"}
          </div>

          <span className="pdf-viewer-brand">
            InStudy
          </span>
        </header>

        <nav className="pdf-toolbar">
          <div className="pdf-page-controls">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
            >
              Previous
            </button>

            <span>
              {pageNumber} / {numPages || "—"}
            </span>

            <button
              type="button"
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber((p) => p + 1)}
            >
              Next
            </button>
          </div>

          <div className="pdf-zoom-controls">
            <button
              type="button"
              onClick={() => changeZoom(-0.1)}
            >
              −
            </button>

            <span>{Math.round(zoom * 100)}%</span>

            <button
              type="button"
              onClick={() => changeZoom(0.1)}
            >
              +
            </button>
          </div>
        </nav>

        <section className="pdf-document-area">

          {loading && (
            <p>Loading your document...</p>
          )}

          {!loading && error && (
            <div className="pdf-error">
              <h2>Unable to open document</h2>
              <p>{error}</p>

              <button
                type="button"
                onClick={() => router.back()}
              >
                Go Back
              </button>
            </div>
          )}

          {!loading && !error && pdfUrl && (
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
                onLoadSuccess={handlePDFLoad}
                onLoadProgress={({ loaded, total }) => {
                  if (total) {
                    setLoadProgress(
                      Math.round((loaded / total) * 100)
                    );
                  }
                }}
                onLoadError={(err) => {
                  console.error("PDF rendering error:", err);
                  setError("Unable to render this PDF.");
                }}
              />
            </>
          )}

        </section>
      </main>
    </ProtectedRoute>
  );
}

export default function PDFViewerPage({ params }) {
  return (
    <Suspense
      fallback={
        <main className="pdf-viewer-page">
          <p>Preparing your InStudy viewer...</p>
        </main>
      }
    >
      <PDFViewerContent params={params} />
    </Suspense>
  );
}