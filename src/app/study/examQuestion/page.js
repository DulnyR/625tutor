//src/app/study/examQuestion/page.js
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist'; // Correct main import
import LoadingScreen from '../loadingScreen';
import jsPDF from 'jspdf';

// findTextInPDF function remains the same
export async function findTextInPDF(pdf, searchText, endTextOptions, startRange = 2) {
  let startPage = null;
  let endPage = null;
  const normalize = (text) => (typeof text === 'string' ? text.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim() : '');
  const normalizedSearch = normalize(searchText);
  const normalizedEndTexts = Array.isArray(endTextOptions)
    ? endTextOptions.map(option => normalize(option))
    : [normalize(endTextOptions)];

  for (let pageNumber = startRange; pageNumber <= pdf.numPages; pageNumber++) {
    console.log(`[EXAMQUESTION] Searching page ${pageNumber} for text: "${normalizedSearch}"`);
    try {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      const normalizedPageText = normalize(pageText);

      if (!(normalizedPageText.includes('written examination marking scheme'))) {
        if (startPage === null && normalizedPageText.includes(normalizedSearch)) {
          startPage = pageNumber;
        } else if (startPage !== null && endPage === null) {
          for (const endText of normalizedEndTexts) {
            if (normalizedPageText.includes(endText)) {
              endPage = pageNumber;
              break;
            }
          }
        }
      }
      if (startPage !== null && endPage !== null) break;
    } catch (pageError) {
      console.error(`Error loading page ${pageNumber}:`, pageError);
    }
  }
  return { startPage, endPage };
}


const ExamQuestion = () => {
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get('subject');
  const levelParam = searchParams.get('level');
  const yearParam = searchParams.get('year');
  const examParam = searchParams.get('exam');
  const paperParam = searchParams.get('paper');
  const questionParam = searchParams.get('question');

  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState(false);
  const [year, setYear] = useState('');
  const [exam, setExam] = useState('');
  const [paper, setPaper] = useState('');
  const [question, setQuestion] = useState('');

  const [examInfo, setExamInfo] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState(null);
  const [examLink, setExamLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const pdfContainerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[EXAMQUESTION] pdfjsLib object:', pdfjsLib);
      console.log('[EXAMQUESTION] PDF.js version:', pdfjsLib.version); // Log the version
      console.log('[EXAMQUESTION] Checking worker. Current pdfjsLib.GlobalWorkerOptions.workerSrc:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      if (pdfjsLib.GlobalWorkerOptions.workerSrc) {
        console.log('[EXAMQUESTION] Worker seems ready in ExamQuestion:', pdfjsLib.GlobalWorkerOptions.workerSrc);
        setIsWorkerReady(true);
      } else {
        console.warn('[EXAMQUESTION] Worker not set by global setup. THIS IS A FALLBACK. Check global setup logs.');
      }
    }
  }, []);

  useEffect(() => {
    let currentSubject = subjectParam;
    if (currentSubject && currentSubject.includes('Design')) {
      currentSubject = 'Design & Communication Graphics';
    }
    setSubject(currentSubject || '');
    setLevel(levelParam === 'higher');
    setYear(yearParam || '');
    setExam(examParam || '');
    setPaper(paperParam || '');
    setQuestion(questionParam || '');
  }, [subjectParam, levelParam, yearParam, examParam, paperParam, questionParam]);

  useEffect(() => {
    if (subject && year && paper && exam) { // Ensure all necessary params are derived before fetching
      fetchExamQuestion();
    }
  }, [subject, year, paper, exam, level]); // Added level as it's used in fetch

  useEffect(() => {
    if (isWorkerReady && pdfUrl && examInfo?.question) {
      console.log('[EXAMQUESTION] Worker is ready, PDF URL and examInfo are set. Proceeding to load PDF.');
      if (pdfContainerRef.current) {
        pdfContainerRef.current.innerHTML = '<p class="text-center text-gray-500 p-10">Loading PDF content...</p>';
      }
      setError(null);
      loadPdfAndSearchQuestion(pdfUrl, `${examInfo.question}`);
    } else if (pdfUrl && examInfo?.question && !isWorkerReady) {
      console.warn('[EXAMQUESTION] Attempted to load PDF, but worker is NOT ready.');
      if (pdfContainerRef.current) {
        pdfContainerRef.current.innerHTML = '<p class="text-center text-orange-500 p-10">PDF system is initializing. Please wait...</p>';
      }
    }
  }, [isWorkerReady, pdfUrl, examInfo]); // examInfo.question is implicitly covered by examInfo


  const fetchExamQuestion = async () => {
    if (!subject || !year || !paper || !exam) {
      console.warn("Missing parameters for fetching exam question. Subject:", subject, "Year:", year, "Paper:", paper, "Exam:", exam);
      setError(<p>Missing information to fetch the exam question.</p>);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (exam === "Oral") {
        setError(
          <div className="text-center">
            <p className="text-gray-800">
              Please practice for the {subject} oral exam.
            </p>
          </div>
        );
        setLoading(false);
        return;
      }

      const { data: pdfLinks, error: pdfLinksError } = await supabase
        .from('pdf_links')
        .select('file_name, exam_link')
        .eq('subject', subject)
        .eq('year', year)
        .eq('paper', paper)
        .eq('higher_level', level);

      if (pdfLinksError) {
        throw new Error(`Error fetching PDF links: ${pdfLinksError.message}`);
      }

      if (!pdfLinks || pdfLinks.length === 0) {
        const errorMsg = `No PDF link found for: ${subject}, Year: ${year}, Paper: ${paper}, Level: ${level ? 'Higher' : 'Ordinary'}.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const fileName = pdfLinks[0].file_name;
      const { data: publicUrlData, error: storageError } = supabase.storage
        .from('exam_bucket')
        .getPublicUrl(fileName);

      if (storageError) {
        throw new Error(`Error getting public URL for ${fileName}: ${storageError.message}`);
      }
      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error(`Could not retrieve public URL for ${fileName}.`);
      }
      const fetchedPdfUrl = publicUrlData.publicUrl;

      var description = question + ". Press Next if you have not studied this topic.";
      switch (subject) {
        case "English":
          if (question.includes('Comprehending')) {
            description = "Question A and Question B on different texts in the Comprehending Section.";
          } else if (question.includes('Composing')) {
            description = "one of the Composing questions.";
          } else if (question.includes('The Single Text')) {
            description = "one of The Single Text questions. Press Next if your text is not one of the options.";
          } else if (question.includes('The Comparative Study')) {
            description = "one of The Comparative Study questions. Press Next if your text is not one of the options.";
          } else if (question.includes('Poetry')) {
            description = "Questions A and B of The Poetry questions. Press Next if you haven't studied any of the poets in the list.";
          }
          break;
        case "Physics":
          if (question.includes('Section A')) {
            description = "the Section A questions you have covered.";
          } else if (question.includes('Section B')) {
            description = "the Section B questions you have covered.";
          }
          break;
        case "Irish":
          if (question.includes('An Chluastuiscint')) {
            description = "the An Chluastuiscint question. Press play below to listen to the audio.";
          } else if (question.includes('An Cheapodóireacht')) {
            description = "one of the An Cheapodóireacht questions.";
          } else if (question.includes('Léamhthuiscint')) {
            description = "Part A and Part B of the Léamhthuiscint section.";
          } else if (question.includes('Prós')) {
            description = "both parts from either A or B in the Prós section.";
          } else if (question.includes('Filíocht')) {
            description = "both parts from either A or B in the Filíocht section.";
          }
          break;
        case "Polish":
          if (question.includes('Pytanie 3')) {
            description = "one of the Pytanie 3 parts.";
          } else if (question.includes('Pytanie 4')) {
            description = "one of the Pytanie 4 parts.";
          } else if (question.includes('Pytanie 5')) {
            description = "one of the Pytanie 5 parts.";
          } else if (question.includes('Listening')) {
            description = "the Listening question. Press play below to listen to the audio.";
          }
          break;
        case "Design & Communication Graphics":
          if (question.includes('Section A - Core')) {
            description = "the Section A - Core questions you have covered.";
          } else if (question.includes('Section B - Core')) {
            description = "the Section B - Core questions you have covered.";
          } else if (question.includes('Section C - Applied Graphics')) {
            description = "the Section C - Applied Graphics questions you have covered. This can take longer to load due to contours.";
          }
          break;
        case "Spanish":
          if (question.includes('Listening')) {
            description = "the Listening question. Press play below to listen to the audio.";
          }
          break;
        default:
          break;
      }

      setExamInfo({
        subject,
        year,
        paper,
        higher_level: level,
        question,
        description: description,
      });

      setPdfUrl(fetchedPdfUrl);
      if (pdfLinks[0].exam_link) {
        setExamLink(pdfLinks[0].exam_link);
      }

    } catch (error) {
      console.error('Error in fetchExamQuestion:', error.message);
      setError(
        <div className="text-center">
          <p className="text-gray-800">
            Exam paper view for {subject} coming soon or an error occurred.
          </p>
          <p className="text-gray-700 text-sm">
            Details: {error.message}
          </p>
          <p className="text-gray-800">
            Please attempt an exam question you have not done before.
          </p>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPdfAndSearchQuestion = async (currentPdfUrl, searchTextInput) => {
    if (!pdfContainerRef.current) {
      console.error("[EXAMQUESTION] PDF container ref is not available.");
      return;
    }
    try {
      if (typeof window === 'undefined') return;

      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        console.error('[EXAMQUESTION] CRITICAL: GlobalWorkerOptions.workerSrc is STILL NOT SET before getDocument!');
        setError(<p className="text-red-500">PDF Worker not configured. Cannot load PDF.</p>);
        return;
      }

      // Dynamically get PDF.js version for URLs
      const pdfjsVersion = pdfjsLib.version;
      const CMAP_URL = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/cmaps/`;
      const STANDARD_FONT_DATA_URL = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/standard_fonts/`;

      console.log('[EXAMQUESTION] About to call getDocument. Worker src:', pdfjsLib.GlobalWorkerOptions.workerSrc);
      console.log('[EXAMQUESTION] Using CMAP_URL:', CMAP_URL);
      console.log('[EXAMQUESTION] Using STANDARD_FONT_DATA_URL:', STANDARD_FONT_DATA_URL);


      let urlToLoad = currentPdfUrl;
      if (!urlToLoad.endsWith('.pdf')) {
        urlToLoad += '.pdf';
        currentPdfUrl = urlToLoad;
      }
      console.log("[EXAMQUESTION] Loading PDF from URL:", urlToLoad);

      console.log('[EXAMQUESTION] PDF.js Version for URLs:', pdfjsVersion);
      console.log('[EXAMQUESTION] CMAP_URL being passed to getDocument:', CMAP_URL);
      console.log('[EXAMQUESTION] STANDARD_FONT_DATA_URL being passed to getDocument:', STANDARD_FONT_DATA_URL);
      console.log('[EXAMQUESTION] useSystemFonts being passed to getDocument:', true);

      const loadingTask = pdfjsLib.getDocument({
        url: urlToLoad,
        cMapUrl: CMAP_URL,
        cMapPacked: true,
        standardFontDataUrl: STANDARD_FONT_DATA_URL,
        useSystemFonts: true, // Recommended for better font matching
      });
      const pdf = await loadingTask.promise;

      console.log('[EXAMQUESTION] PDF loaded. Getting font data...');
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) { // Check first few pages
        try {
          const page = await pdf.getPage(i);
          const operatorList = await page.getOperatorList();
          const FONT_NAME_REGEX = /^[A-Z]{6}\+(.+)$/; // Common format for subsetted embedded fonts

          operatorList.fnArray.forEach((fn, j) => {
            if (fn === pdfjsLib.OPS.setFont) {
              const fontArg = operatorList.argsArray[j][0];
              const font = page.commonObjs.get(fontArg);
              if (font) {
                let fontName = font.name;
                const match = FONT_NAME_REGEX.exec(fontName);
                if (match) {
                  fontName = `${match[1]} (subsetted)`;
                }
              } else {
                console.warn(`[EXAMQUESTION] Page ${i}, Font Index ${j}: Could not retrieve font object for arg: ${fontArg}`);
              }
            }
          });
        } catch (e) {
          console.error(`[EXAMQUESTION] Error getting font data for page ${i}:`, e);
        }
      }

      while (pdfContainerRef.current.firstChild) {
        pdfContainerRef.current.removeChild(pdfContainerRef.current.firstChild);
      }

      var searchText = searchTextInput;
      var nextQuestionText = ['Acknowledgements', 'Blank Page',
        'Do not write on this page', 'There is no examination material on this page',
        'See Loose Insert', 'This is space for extra work'];

      switch (subject) {
        case "Mathematics":
        case "Engineering":
          nextQuestionText.push(`Question ${parseInt(examInfo.question.match(/\d+/)[0]) + 1}`);
          break;
        case "English":
          if (examInfo.question.includes('Comprehending')) {
            nextQuestionText.push('Composing');
          } else if (examInfo.question.includes('The Single Text')) {
            nextQuestionText.push('The Comparative Study');
          } else if (examInfo.question.includes('The Comparative Study')) {
            nextQuestionText.push('Poetry');
          }
          break;
        case "Physics":
          if (examInfo.question.includes('Section A')) {
            searchText = '40 marks';
            nextQuestionText.push('56 marks');
          } else if (examInfo.question.includes('Section B')) {
            searchText = '56 marks';
          }
          break;
        case "Irish":
          if (examInfo.question.includes('An Chluastuiscint')) {
            nextQuestionText.push('An Cheapadóireacht');
          } else if (examInfo.question.includes('An Cheapadóireacht')) {
            searchText = 'Freagair do';
            nextQuestionText.push('Tosaigh gach ceist ar leathanach nua');
          } else if (examInfo.question.includes('Léamhthuiscint')) {
            nextQuestionText.push('Prós');
          } else if (examInfo.question.includes('Prós')) {
            nextQuestionText.push('Filíocht');
          }
          break;
        case "Polish":
          if (!examInfo.question.includes('Listening')) {
            if (examInfo.question.includes('Pytanie 5')) {
              nextQuestionText.push('Listening');
            } else {
              nextQuestionText.push(`Pytanie ${parseInt(examInfo.question.match(/\d+/)[0]) + 1}`);
            }
          } else {
            searchText = 'You will hear';
          }
          break;
        case "Design & Communication Graphics":
          if (examInfo.question.includes('Section A - Core')) {
            nextQuestionText.push('This Contour Map');
          } else if (examInfo.question.includes('Section B - Core')) {
            nextQuestionText.push('Section C - Applied Graphics');
          }
          break;
        case "Spanish":
          if (examInfo.question.includes('Section A')) {
            nextQuestionText.push('Section B');
          } else if (examInfo.question.includes('Section B')) {
            nextQuestionText.push('Section C');
          } else if (examInfo.question.includes('Section C')) {
            nextQuestionText.push('Write your answer to question 5');
          } else if (examInfo.question.includes('Listening')) {
            searchText = 'ANUNCIO';
          }
          break;
        default:
          break; f
      }

      let startPage, endPage;

      if (subject.includes('Spanish') && (searchText.includes('Section C') || searchText.includes('Section B'))) {
        console.log(`[EXAMQUESTION] Special case for Spanish Section C or B. Searching from page 5.`);
        const result = await findTextInPDF(pdf, searchText, nextQuestionText, 5);
        startPage = result.startPage;
        endPage = result.endPage;
      } else {
        const result = await findTextInPDF(pdf, searchText, nextQuestionText);
        startPage = result.startPage;
        endPage = result.endPage;
      }

      console.log(`[EXAMQUESTION] Search completed. Start Page: ${startPage}, End Page: ${endPage}`);

      if (startPage === null) {
        console.warn(`[EXAMQUESTION] Text "${searchText}" not found. Rendering the entire PDF from page 1 (or 2 if default).`);
        startPage = 1; // Defaulting to page 1 if not found, consider your findTextInPDF default if different.
        endPage = pdf.numPages;
      }
      if (endPage === null || endPage < startPage) {
        endPage = pdf.numPages;
      }

      startPage = Math.max(1, Math.min(startPage, pdf.numPages));
      endPage = Math.max(startPage, Math.min(endPage, pdf.numPages));

      console.log(`[EXAMQUESTION] Found startPage: ${startPage}, endPage: ${endPage} for search text "${searchText}"`);

      if (subject === 'Design & Communication Graphics' || subject === "Spanish") {
        let originalPaper, modifiedPaper;
        if (subject === 'Design & Communication Graphics' &&
          examInfo.question.includes('Section C - Applied Graphics')) {
          originalPaper = 2;
          modifiedPaper = 1;
        } else if (subject === 'Spanish' && examInfo.question.includes('Section B')) {
          originalPaper = 1;
          modifiedPaper = 2;
        }
        if (originalPaper && modifiedPaper) {
          if (currentPdfUrl) {
            console.log(`Modifying ${currentPdfUrl} for ${subject} from ${originalPaper} to ${modifiedPaper}`);
            let modifiedPdfUrl = currentPdfUrl.replace(new RegExp(`${originalPaper}(?=[^${originalPaper}]*\\.pdf$)`), `${modifiedPaper}`);
            console.log(`[EXAMQUESTION] Loading modified PDF for ${subject} from URL:`, modifiedPdfUrl);
            const modifiedLoadingTask = pdfjsLib.getDocument({
              url: modifiedPdfUrl,
              cMapUrl: CMAP_URL,
              cMapPacked: true,
              standardFontDataUrl: STANDARD_FONT_DATA_URL,
              useSystemFonts: true,
            });
            const modifiedPdf = await modifiedLoadingTask.promise;

            const firstPage = await modifiedPdf.getPage(1);

            const firstPageCanvas = document.createElement('canvas');
            const firstPageContext = firstPageCanvas.getContext('2d');
            pdfContainerRef.current.appendChild(firstPageCanvas);
            const firstPageViewport = firstPage.getViewport({ scale: 1.1 });
            firstPageCanvas.height = firstPageViewport.height;
            firstPageCanvas.width = firstPageViewport.width;
            await firstPage.render({
              canvasContext: firstPageContext,
              viewport: firstPageViewport,
            }).promise;
          } else {
            console.warn("[EXAMQUESTION] currentPdfUrl is undefined, cannot load modified PDF for DCG/Spanish special case.");
          }
        }
      }

      console.log(`[EXAMQUESTION] Rendering pages ${startPage} to ${endPage}`);
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          // Ensure canvas has CSS to prevent distortion, e.g., max-width: 100%; height: auto;
          // This is usually better handled by CSS on the canvas elements globally or via a class.
          // canvas.style.maxWidth = "100%";
          // canvas.style.height = "auto";

          const viewport = page.getViewport({ scale: 1.1 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (pdfContainerRef.current) { // Check ref again before appending
            pdfContainerRef.current.appendChild(canvas);
            await page.render({ canvasContext: context, viewport: viewport }).promise;
          } else {
            console.warn(`[EXAMQUESTION] pdfContainerRef became null before rendering page ${pageNum}`);
            break; // Stop if container is gone
          }
        } catch (pageRenderError) {
          console.error(`[EXAMQUESTION] Error rendering page ${pageNum}:`, pageRenderError);
        }
      }

      if (startPage !== null && pdfContainerRef.current && pdfContainerRef.current.children.length > 0) {
        pdfContainerRef.current.children[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (pdfContainerRef.current && pdfContainerRef.current.children.length === 0) {
        pdfContainerRef.current.innerHTML = `<p class="text-center text-gray-500 p-10">No content rendered for the selected question.</p>`;
      }

    } catch (err) {
      console.error('[EXAMQUESTION] Error in loadPdfAndSearchQuestion:', err);
      let errorContent = 'Error loading PDF or searching for question text.';
      if (examLink) {
        errorContent += `
              <p class="mt-2 text-black">Please try accessing the exam paper directly: 
                  <a href="${examLink}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">
                      Open Exam Paper
                  </a>
              </p>`;
      }
      if (pdfContainerRef.current) {
        pdfContainerRef.current.innerHTML = errorContent;
      } else {
        setError(<div dangerouslySetInnerHTML={{ __html: errorContent }} />);
      }
    }
  };

  const printRenderedPDF = () => {
    if (!pdfContainerRef.current) return;
    const pdfToPrint = new jsPDF();
    const canvases = pdfContainerRef.current.querySelectorAll('canvas');

    canvases.forEach((canvas, index) => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      if (index > 0) {
        pdfToPrint.addPage();
      }

      if (imgHeight > pageHeight) {
        while (heightLeft > 0) {
          pdfToPrint.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          position -= pageHeight;
          if (heightLeft > 0) {
            pdfToPrint.addPage();
          }
        }
      } else {
        pdfToPrint.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      }
    });

    try {
      pdfToPrint.autoPrint();
      const blobUrl = pdfToPrint.output('bloburl');
      if (blobUrl) {
        window.open(blobUrl, '_blank');
      } else {
        console.error("Failed to generate bloburl for printing.");
        alert("Could not open PDF for printing. Please try again or check browser console.");
      }
    } catch (printError) {
      console.error("Error during PDF print generation:", printError);
      alert("An error occurred while preparing the PDF for printing.");
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-4 md:p-8 pb-24">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-4 md:p-8 space-y-6 mt-20 md:mt-24">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4">Exam Question</h1>
        {error && <div className="text-center p-4 bg-red-100 text-red-700 rounded">{error}</div>}
        {examInfo && !error && (
          <div className="w-full">
            <div className="mb-4 text-center">
              <p className="text-lg md:text-xl font-semibold text-gray-700">
                Attempt {examInfo.description}
              </p>
            </div>
            <div
              className="w-full h-[70vh] overflow-auto border border-gray-300 rounded bg-gray-50"
              ref={pdfContainerRef}
              aria-live="polite"
              // Add a style for canvas children to help prevent distortion
              // This is a general good practice.
              style={{
                "--canvas-max-width": "100%", /* Make canvas responsive within container */
                "--canvas-height": "auto",   /* Maintain aspect ratio */
              }}
            >
              {/* PDF pages will be rendered here. Children canvas should ideally have CSS:
                  canvas { max-width: var(--canvas-max-width); height: var(--canvas-height); } 
                  This can be in a global CSS or applied dynamically.
              */}
              {!pdfContainerRef.current?.firstChild && <p className="text-center text-gray-500 p-10">Loading PDF content...</p>}
            </div>
            {subject === 'Design & Communication Graphics' && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={printRenderedPDF}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Print PDF
                </button>
              </div>
            )}
          </div>
        )}
        {!examInfo && !error && !loading && (
          <p className="text-center text-gray-600">No exam information to display. Please check the URL parameters.</p>
        )}
      </div>
    </div>
  );
};

export default ExamQuestion;