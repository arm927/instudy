
"use client";

import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Keep options outside the component so they stay stable between renders.
// Defaults let pdf.js stream the file; the old settings (disableStream +
// 64 KB range chunks) caused dozens of tiny sequential requests.
const PDF_OPTIONS = {};

export default function PDFDocument({
  pdfUrl,
  pageNumber,
  zoom,
  onLoadSuccess,
  onLoadProgress,
  onLoadError,
}) {
  return (
    <Document
      file={pdfUrl}
      options={PDF_OPTIONS}
      onLoadSuccess={onLoadSuccess}
      onLoadProgress={onLoadProgress}
      onLoadError={onLoadError}
      loading={<p>Preparing document...</p>}
      error={<p>Unable to read this PDF.</p>}
    >
      <Page
        pageNumber={pageNumber}
        scale={zoom}
        devicePixelRatio={1}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={<p>Rendering page...</p>}
      />
    </Document>
  );
}
