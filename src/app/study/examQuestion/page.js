"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import LoadingScreen from '../loadingScreen';
import next from 'next';
import jsPDF from 'jspdf';

export async function findTextInPDF(pdf, searchText, endTextOptions, startRange = 2) {
  let startPage = null;
  let endPage = null;

  // More flexible normalization
  const normalize = (text) => (typeof text === 'string' ? text.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim() : '');
  const normalizedSearch = normalize(searchText);

  // More flexible end text matching
  const normalizedEndTexts = Array.isArray(endTextOptions)
    ? endTextOptions.map(option => normalize(option))
    : [normalize(endTextOptions)];

  for (let pageNumber = startRange; pageNumber <= pdf.numPages; pageNumber++) {
    try {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      // Combine all text items for more reliable searching
      const pageText = textContent.items.map(item => item.str).join(' ');
      const normalizedPageText = normalize(pageText);

      // Search for start text if not found yet
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

      // If both start and end found, we can stop searching
      if (startPage !== null && endPage !== null) break;

    } catch (pageError) {
      console.error(`Error loading page ${pageNumber}:`, pageError);
    }
  }

  return { startPage, endPage };
}

const ExamQuestion = () => {
  const searchParams = useSearchParams();
  let subject = searchParams.get('subject');
  if (subject && subject.includes('Design')) {
    subject = 'Design & Communication Graphics';
  }
  const level = searchParams.get('level') === 'higher';
  const year = searchParams.get('year');
  const exam = searchParams.get('exam');
  const paper = searchParams.get('paper');
  const question = searchParams.get('question');

  const [examInfo, setExamInfo] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState(null);
  const [examLink, setExamLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const pdfContainerRef = useRef(null);

  useEffect(() => {
    if (subject) {
      fetchExamQuestion();
    }
  }, [subject]);

  useEffect(() => {
    if (pdfUrl && examInfo?.question) {
      loadPdfAndSearchQuestion(pdfUrl, `${examInfo.question}`);
    }
  }, [pdfUrl, examInfo?.question]); // Only trigger when `examInfo.question` changes

  const fetchExamQuestion = async () => {
    try {
      if (exam == "Oral") {
        setError(
          <div className="text-center">
            <p className="text-black">
              Please practice for the {subject} oral exam.
            </p>
          </div>
        );
        setLoading(false);
        return;
      }
      // Fetch the corresponding PDF link
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
        throw new Error('No PDF link found.');
      }

      const fileName = pdfLinks[0].file_name;
      const { data: publicUrl } = supabase.storage
        .from('exam_bucket') // Replace with your bucket name
        .getPublicUrl(fileName);

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
        year: year,
        paper: paper,
        higher_level: level ? 'Higher' : 'Ordinary',
        question: question,
        description: description,
      });

      // Set the PDF URL to the Supabase Storage URL
      setPdfUrl(publicUrl.publicUrl);

      // Set the exam link
      if (pdfLinks[0].exam_link) {
        setExamLink(pdfLinks[0].exam_link);
      }
    } catch (error) {
      console.error('Error fetching exam question:', error);
      setError(
        <div className="text-center">
          <p className="text-black">
            Exam paper view for {subject} coming soon!
          </p>
          <p className="text-black">
            Please attempt an exam question you have not done before.
          </p>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPdfAndSearchQuestion = async (pdfUrl, searchTextInput) => {
    try {
      // Ensure this runs only on the client side
      if (typeof window === 'undefined') return;

      // Set up PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

      // Fix the PDF URL if needed
      if (!pdfUrl.endsWith('.pdf')) {
        pdfUrl += '.pdf';
      }

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;

      // Clear the container properly
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
          break;
      }

      let { startPage, endPage } = await findTextInPDF(pdf, searchText, nextQuestionText);

      // If startPage is not found, render the entire PDF
      if (startPage === null) {
        console.warn(`Text "${searchText}" not found. Rendering the entire PDF.`);
        startPage = 2;
        endPage = pdf.numPages;
      }

      // If endPage is not found, render until the last page
      if (endPage === null) {
        endPage = pdf.numPages;
      }

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
          const modifiedPdfUrl = pdfUrl.replace(new RegExp(`${originalPaper}(?=[^${originalPaper}]*\\.pdf$)`), `${modifiedPaper}`);
          const modifiedLoadingTask = pdfjsLib.getDocument(modifiedPdfUrl);
          const modifiedPdf = await modifiedLoadingTask.promise;

          const lastPageNumber = modifiedPdf.numPages;
          const lastPage = await modifiedPdf.getPage(lastPageNumber);

          // Create a canvas for the last page
          const lastPageCanvas = document.createElement('canvas');
          const lastPageContext = lastPageCanvas.getContext('2d');
          pdfContainerRef.current.appendChild(lastPageCanvas);

          // Set canvas dimensions for the last page
          const lastPageViewport = lastPage.getViewport({ scale: 1.1 });
          lastPageCanvas.height = lastPageViewport.height;
          lastPageCanvas.width = lastPageViewport.width;

          // Render the last page on the canvas
          await lastPage.render({
            canvasContext: lastPageContext,
            viewport: lastPageViewport,
          }).promise;
        }
      }

      // Render pages from startPage to endPage
      for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
        try {
          const page = await pdf.getPage(pageNumber);

          // Create a canvas for each page
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          pdfContainerRef.current.appendChild(canvas);

          // Set canvas dimensions
          const viewport = page.getViewport({ scale: 1.1 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Render the page on the canvas
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
        } catch (pageError) {
          console.error(`Error rendering page ${pageNumber}:`, pageError);
        }
      }

      // Scroll to the start of the question
      if (startPage !== null) {
        pdfContainerRef.current.children[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      console.error('Error loading PDF or searching text:', error);

      // If PDF loading fails, show the exam link or provide manual instructions
      if (examLink) {
        setError(
          <p className="text-red-500">
            Failed to load the PDF. Please access the exam paper directly:{' '}
            <a href={examLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
              Open Exam Paper
            </a>
          </p>
        );
      } else {
        setError(
          <p className="text-red-500">
            Failed to load the PDF. Please manually open the {examInfo?.higher_level ? 'Higher' : 'Ordinary'} Level{' '}
            {examInfo?.subject} Paper {examInfo?.paper}, Question {examInfo?.question}.
          </p>
        );
      }
    }
  };

  const printRenderedPDF = () => {
    const pdf = new jsPDF();
    const canvases = pdfContainerRef.current.querySelectorAll('canvas');

    canvases.forEach((canvas, index) => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (index > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    });

    pdf.autoPrint(); // Trigger the print dialog
    window.open(pdf.output('bloburl'), '_blank'); // Open the PDF in a new tab for printing
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-8 pb-24">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6 mt-24">
        <h1 className="text-4xl font-bold text-center text-black mb-4" style={{ paddingTop: '1rem' }}>Exam Question</h1>
        {error && <div>{error}</div>}
        {examInfo && (
          <div className="w-full max-w-6xl flex flex-col mb-40">
            <div className="mb-4 flex justify-center">
              <p className="text-xl font-semibold text-black text-center">Attempt {examInfo.description} </p>
            </div>
            <div className="w-full h-[60vh] overflow-auto" ref={pdfContainerRef}>
              {/* PDF pages will be rendered here */}
            </div>
            {subject === 'Design & Communication Graphics' && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={printRenderedPDF}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Print PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamQuestion;