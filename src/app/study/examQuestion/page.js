"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import '../../globals.css';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import LoadingScreen from '../loadingScreen';

const ExamQuestion = () => {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject');
  const level = searchParams.get('level') === 'higher';
  const year = searchParams.get('year');
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
      // Fetch the corresponding PDF link
      console.log('Fetching PDF link for:', subject, year, paper, level);
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

      console.log('PDF links fetched:', pdfLinks);

      if (!pdfLinks || pdfLinks.length === 0) {
        throw new Error('No PDF link found.');
      }

      const fileName = pdfLinks[0].file_name;
      const { data: publicUrl } = supabase.storage
        .from('exam_bucket') // Replace with your bucket name
        .getPublicUrl(fileName);

      var description;

      switch (subject) {
        case "English":
          if (question.includes('Comprehending')) {
            description = "Question A and Question B on different texts.";
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
            description = "a question from Section A.";
          } else if (question.includes('Section B')) {
            description = "a question from Section B.";
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
            description = "two parts from either A or B in the Prós section.";
          } else if (question.includes('Filíocht')) {
            description = "two parts from either A or B in the Filíocht section.";
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
        description: description ? description : question,
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

  const loadPdfAndSearchQuestion = async (pdfUrl, searchText) => {
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

      let startPage = null;
      let endPage = null;

      var nextQuestionText = 'Acknowledgements';

      switch (subject) {
        case "Mathematics":
          nextQuestionText = `Question ${parseInt(examInfo.question.match(/\d+/)[0]) + 1}`;
          break;
        case "English":
          if (examInfo.question.includes('Comprehending')) {
            nextQuestionText = 'Composing';
          } else if (examInfo.question.includes('The Single Text')) {
            nextQuestionText = 'The Comparative Study';
          } else if (examInfo.question.includes('The Comparative Study')) {
            nextQuestionText = 'Poetry';
          }
          break;
        case "Physics":
          if (examInfo.question.includes('Section A')) {
            searchText = 'Each question carries 40 marks.';
            nextQuestionText = 'Each question carries 56 marks.';
          } else if (examInfo.question.includes('Section B')) {
            searchText = 'Each question carries 56 marks.';
          }
        case "Irish":
          if (examInfo.question.includes('An Chluastuiscint')) {
            nextQuestionText = 'An Cheapadóireacht';
          } else if (examInfo.question.includes('An Cheapadóireacht')) {
            nextQuestionText = 'Tosaigh gach ceist ar leathanach nua';
          } else if (examInfo.question.includes('Léamhthuiscint')) {
            nextQuestionText = 'Prós';
          } else if (examInfo.question.includes('Prós')) {
            nextQuestionText = 'Filíocht';
          }
        default:
          break;
      }

      console.log('Searching for:', searchText, 'and', nextQuestionText);

      // Loop through all pages
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        try {
          const page = await pdf.getPage(pageNumber);

          // Get the text content of the page
          const textContent = await page.getTextContent();

          // Search for the start and end points
          const foundStart = textContent.items.some((item) =>
            item.str && item.str.toLowerCase().includes(searchText.toLowerCase())
          );

          const foundEnd = textContent.items.some((item) => {
            const found = item.str && (item.str.toLowerCase().includes(nextQuestionText.toLowerCase()) ||
              item.str.toLowerCase().includes('page for extra work') ||
              item.str.toLowerCase().includes('there is no examination material on this page'));
            if (found) {
              console.log(`Found end text "${nextQuestionText}" on page ${pageNumber}`);
            }
            return found;
          });

          if (foundStart && startPage === null) {
            startPage = pageNumber;
            console.log(`Found start text "${searchText}" on page ${pageNumber
              }${foundEnd ? ' and end text' : ''}`);
          } else if (foundEnd && endPage === null) {
            endPage = pageNumber;
            break;
          }
        } catch (pageError) {
          console.error(`Error loading page ${pageNumber}:`, pageError);
        }
      }

      console.log('Found start page:', startPage, 'and end page:', endPage);

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

      // Render pages from startPage to endPage
      for (let pageNumber = startPage; pageNumber < endPage; pageNumber++) {
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamQuestion;