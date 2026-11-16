"use client";

import { useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PDF_OPTIONS = {};

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
  const pageRefs = useRef({});

  // Scroll the active page into view when pageNumber changes from buttons
  useEffect(() => {
    const el = pageRefs.current[pageNumber];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [pageNumber]);

  // Update current page number while the user scrolls
  useEffect(() => {
    if (!numPages || !onPageChange) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          const page = Number(visible[0].target.dataset.page);
          if (page && page !== pageNumber) {
            onPageChange(page);
          }
        }
      },
      {
        root: containerRef.current,
        threshold: [0.4, 0.6, 0.8],
      }
    );

    Object.values(pageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages, pageNumber, onPageChange]);

  return (
    <div className="pdf-scroll-container" ref={containerRef}>
      <Document
        file={pdfUrl}
        options={PDF_OPTIONS}
        onLoadSuccess={onLoadSuccess}
        onLoadProgress={onLoadProgress}
        onLoadError={onLoadError}
        loading={null}
        error={<p>Unable to read this PDF.</p>}
      >
        {numPages > 0 &&
          Array.from({ length: numPages }, (_, i) => {
            const page = i + 1;
            return (
              <div
                key={page}
                className="pdf-page-wrapper"
                data-page={page}
                ref={(el) => {
                  pageRefs.current[page] = el;
                }}
              >
                <Page
                  pageNumber={page}
                  scale={zoom}
                  devicePixelRatio={1}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={null}
                />
              </div>
            );
          })}
      </Document>
    </div>
  );
}