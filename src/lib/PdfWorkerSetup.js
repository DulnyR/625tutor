// src/lib/PdfWorkerSetup.js
"use client";

import { useEffect } from 'react';
// Import the main pdfjs-dist library object to access GlobalWorkerOptions
import * as pdfjsLib from 'pdfjs-dist';

const STATIC_WORKER_FILENAME = 'pdf.worker.min.js'; // Or 'pdf.worker.js' or 'pdf.worker.entry.js' if you are sure
const WORKER_URL = `/${STATIC_WORKER_FILENAME}`; // Path relative to the /public folder

// This top-level execution runs when the module is first imported.
// It's generally preferred for setting up global configurations like this.
if (typeof window !== 'undefined') {

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
  } else {
    if (pdfjsLib.GlobalWorkerOptions.workerSrc !== WORKER_URL) {
        console.warn(`[PdfWorkerSetup] Top-level: Existing workerSrc (${pdfjsLib.GlobalWorkerOptions.workerSrc}) differs from expected (${WORKER_URL}). This might be intentional or an issue.`);
    }
  }
} else {
  // This block will run during SSR/build time if the module is imported there.
  // Setting workerSrc here is usually not effective for client-side PDF.js,
  // as the client needs its own GlobalWorkerOptions.workerSrc.
  console.log('[PdfWorkerSetup] Top-level: typeof window IS undefined (Server-side or build time). Worker setup is primarily for client.');
}

export default function PdfWorkerSetup() {
  // The useEffect hook runs client-side after the component mounts.
  // It can serve as a fallback or a place to confirm the setting.
  useEffect(() => {
    console.log('[PdfWorkerSetup] Component useEffect: Fired.');
    if (typeof window !== 'undefined') {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        console.warn('[PdfWorkerSetup] Component useEffect: WorkerSrc was not set by top-level. Setting it now.');
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
        console.log('[PdfWorkerSetup] Component useEffect: GlobalWorkerOptions.workerSrc set to:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      } else if (pdfjsLib.GlobalWorkerOptions.workerSrc !== WORKER_URL) {
        console.warn(`[PdfWorkerSetup] Component useEffect: Existing workerSrc (${pdfjsLib.GlobalWorkerOptions.workerSrc}) differs from expected (${WORKER_URL}). Not overriding from useEffect unless necessary.`);
        // You could force an override here if you are absolutely sure this component should be the one setting it.
        // Example:
        // console.log('[PdfWorkerSetup] Component useEffect: Forcing override of workerSrc.');
        // pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
      } else {
        console.log('[PdfWorkerSetup] Component useEffect: GlobalWorkerOptions.workerSrc already correctly set to:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      }
    }
  }, []); // Empty dependency array means this runs once after initial mount

  return null; // This component does not render any UI
}