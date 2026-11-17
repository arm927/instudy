"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const BUFFER = 2;

export default function PDFDocument({
  pdfUrl,
  pageNumber,
  zoom,
  numPages,
  onLoadSuccess,
  onLoadProgress,
  onLoadError,
  onPageChange,
}) {
  const containerRef = useRef(null);
  const onPageChangeRef = useRef(onPageChange);
  const [visibleRange, setVisibleRange] = useState({ start: 1, end: 3 });

  // Keep the callback stable so the observer doesn't constantly re-create
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  // IntersectionObserver – only depends on numPages
  useEffect(() => {
    if (!numPages || !containerRef.current) return;

    const container = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number(e.target.dataset.page))
          .filter(Boolean)
          .sort((a, b) => a - b);

        if (visible.length === 0) return;

        const start = Math.max(1, visible[0] - BUFFER);
        const end = Math.min(numPages, visible[visible.length - 1] + BUFFER);

        setVisibleRange((prev) => {
          if (prev.start === start && prev.end === end) return prev;
          return { start, end };
        });

        // Update current page
        const mostVisible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (mostVisible) {
          const page = Number(mostVisible.target.dataset.page);
          if (page) {
            onPageChangeRef.current?.(page);
          }
        }
      },
      {
        root: container,
        threshold: [0.3, 0.5, 0.7],
      }
    );

    const wrappers = container.querySelectorAll("[data-page]");
    wrappers.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [numPages]); // ← only numPages

  // Scroll into view when page changes from buttons
  useEffect(() => {
    if (!pageNumber) return;
    const el = containerRef.current?.querySelector(`[data-page="${pageNumber}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [pageNumber]);

  return (
    <div className="pdf-scroll-container" ref={containerRef}>
      <Document
        file={pdfUrl}
        onLoadSuccess={onLoadSuccess}
        onLoadProgress={onLoadProgress}
        onLoadError={onLoadError}
        loading={null}
        error={<p className="pdf-error-text">Unable to read this PDF.</p>}
      >
        {numPages > 0 &&
          Array.from({ length: numPages }, (_, i) => {
            const page = i + 1;
            const isVisible = page >= visibleRange.start && page <= visibleRange.end;

            return (
              <div
                key={page}
                className="pdf-page-wrapper"
                data-page={page}
                style={{
                  // Fixed height for placeholders prevents layout explosion
                  minHeight: isVisible ? "auto" : "850px",
                }}
              >
                {isVisible ? (
                  <Page
                    pageNumber={page}
                    scale={zoom}
                    devicePixelRatio={1}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={null}
                  />
                ) : (
                  <div className="pdf-page-placeholder" />
                )}
              </div>
            );
          })}
      </Document>
    </div>
  );
}