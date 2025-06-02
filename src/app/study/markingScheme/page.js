"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import LoadingScreen from '../loadingScreen';

import { findTextInPDF } from '../examQuestion/page';

const MarkingScheme = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    let subject = searchParams.get('subject');
    const level = searchParams.get('level') === 'higher';
    const year = searchParams.get('year');
    const question = searchParams.get('question');
    const paper = searchParams.get('paper');

    if (subject && subject.includes('Design')) {
        subject = 'Design & Communication Graphics';
    }

    const [pdfUrl, setPdfUrl] = useState('');
    const [error, setError] = useState(null);
    const [markingLink, setMarkingLink] = useState(null);
    const [loading, setLoading] = useState(true);
    const pdfContainerRef = useRef(null);

    useEffect(() => {
        if (subject && question && paper && year) {
            fetchMarkingScheme();
        }
    }, [subject, question, paper, year]);

    const fetchMarkingScheme = async () => {
        try {
            console.log('Fetching marking scheme for subject:', subject);

            // Fetch the corresponding PDF link for the marking scheme
            const { data: pdfLinks, error: pdfLinksError } = await supabase
                .from('pdf_links')
                .select('file_name, marking_link')
                .eq('subject', subject)
                .eq('higher_level', level)
                .eq('year', year)
                .eq('paper', paper);

            if (pdfLinksError) {
                throw new Error(`Error fetching PDF links: ${pdfLinksError.message}`);
            }

            console.log('PDF links fetched:', pdfLinks);

            if (!pdfLinks || pdfLinks.length === 0) {
                setError('No PDF link found.');
                setLoading(false);
                return;
            }

            // Remove only the paper number (e.g., "1_") from the file name
            const markingSchemeFileName = pdfLinks[0].file_name.replace(/^(.*?_\d{4})_(\d+)_/, '$1_');

            const { data: publicUrl } = supabase.storage
                .from('marking_bucket') // Replace with your bucket name
                .getPublicUrl(markingSchemeFileName);

            setPdfUrl(publicUrl.publicUrl);

            // Set the marking link
            if (pdfLinks[0].marking_link) {
                setMarkingLink(pdfLinks[0].marking_link);
            }
        } catch (error) {
            console.error('Error fetching marking scheme:', error);
            setError(`Error fetching marking scheme: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadPdfAndSearchQuestion = async (pdfUrl, question) => {
        try {
            // Set up PDF.js worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

            if (!pdfUrl.endsWith('.pdf')) {
                pdfUrl += '.pdf';
            }

            // Clear the container properly
            while (pdfContainerRef.current.firstChild) {
                pdfContainerRef.current.removeChild(pdfContainerRef.current.firstChild);
            }

            // Load the PDF document
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            let searchText = question;
            let nextQuestionText = `Blank Page`;

            // Determine the search range based on the paper number
            const totalPages = pdf.numPages;

            let startRange = 2;
            let endRange = totalPages - 1;
            let cutoffPage;

            for (let pageNumber = startRange + 3; pageNumber <= totalPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const textContent = await page.getTextContent();
                const foundPaper2 = textContent.items.some((item) =>
                    item.str.toLowerCase().includes("paper 2")
                );
                if (foundPaper2) {
                    cutoffPage = pageNumber;
                    break;
                }
            }

            console.log('Cutoff page:', cutoffPage);

            if (Number(paper) === 1) {
                if (cutoffPage) {
                    endRange = cutoffPage - 1;
                }
            } else if (Number(paper) === 2) {
                // Search the second half of the document
                startRange = cutoffPage;
            } 

            switch (subject) {
                case "Mathematics":
                case "Engineering":
                    if (year > 2015 && subject === "Mathematics") {
                        searchText = `Q${parseInt(question.match(/\d+/)[0])}`;
                        nextQuestionText = `Q${parseInt(question.match(/\d+/)[0]) + 1}`;
                    } else {
                        searchText = question;
                        nextQuestionText = `Question ${parseInt(question.match(/\d+/)[0]) + 1}`;
                    }
                    break;
                case "English":
                    searchText = question.toUpperCase();
                    if (question.includes('Comprehending')) {
                        nextQuestionText = 'SECTION II – COMPOSING';
                    } else if (question.includes('Composing')) {
                        searchText = 'SECTION II – COMPOSING';
                        nextQuestionText = 'Paper 2';
                    } else if (question.includes('The Single Text')) {
                        nextQuestionText = 'SECTION II – THE COMPARATIVE STUDY';
                    } else if (question.includes('The Comparative Study')) {
                        searchText = 'SECTION II – THE COMPARATIVE STUDY';
                        nextQuestionText = 'UNSEEN POEM';
                    } else if (question.includes('Poetry')) {
                        searchText = 'Poetry (';
                        nextQuestionText = 'Appendix 1';
                    }
                    break;
                case "Physics":
                    if (question.includes('Section A')) {
                        searchText = 'Tick';
                    } else if (question.includes('Section B')) {
                        searchText = '( h )';
                    }
                    startRange = 4;
                    break;
                case "Irish":
                    if (question.includes('An Chluastuiscint')) {
                        nextQuestionText = 'Cheapadóireacht';
                    } else if (question.includes('An Cheapadóireacht')) {
                        nextQuestionText = 'Míléamh';
                    } else if (question.includes('Léamhthuiscint')) {
                        nextQuestionText = 'Prós';
                    } else if (question.includes('Prós')) {
                        nextQuestionText = 'Filíocht';
                    } else if (question.includes('Filíocht')) {
                        nextQuestionText = 'Scéim Mharcála Mhodhnaithe';
                    }
                    break;
                case "Polish":
                    if (question.includes('Pytanie 1')) {
                        searchText = 'Question 1';
                        nextQuestionText = 'Question 2';
                    } else if (question.includes('Pytanie 2')) {
                        searchText = 'Question 2';
                        nextQuestionText = 'SECTION B';
                    } else if (question.includes('Pytanie 3') || question.includes('Pytanie 4') ||
                        question.includes('Pytanie 5')) {
                        searchText = 'SECTION B';
                        nextQuestionText = 'Listening Comprehension';
                    } else if (question.includes('Listening')) {
                        searchText = 'Listening Comprehension';
                        nextQuestionText = 'APPENDIX 1'
                    }
                    break;
                case "Design & Communication Graphics":
                    if (question.includes('Section A - Core')) {
                        searchText = 'Question A';
                    } else if (question.includes('Section B - Core')) {
                        searchText = 'Question B';
                    } else if (question.includes('Section C - Applied Graphics')) {
                        searchText = 'Question C';
                    }
                    break;
                case "Spanish":
                    if (question.includes('Section A')) {
                        nextQuestionText = 'Section B';
                    } else if (question.includes('Section B')) {
                        nextQuestionText = 'Section C';
                    } else if (question.includes('Section C')) {
                        nextQuestionText = 'Listening';
                    } else if (question.includes('Listening')) {
                        searchText = 'Anuncio';
                        if (year > 2021) {
                            nextQuestionText = 'Appendix One';
                        } else {
                            nextQuestionText = 'Prescribed Literature';
                        }
                    }
                    break;
                default:
                    break;
            }

            // Loop through the relevant range of pages
            try {
                let startRange = 2;
                if (subject === 'Mathematics' && Number(paper) === 2) {
                    startRange = Math.floor(pdf.numPages / 2);
                } 
                let { startPage, endPage } = await findTextInPDF(pdf, searchText, [nextQuestionText], startRange);

                // If startPage is not found, render the entire search range
                if (startPage === null) {
                    console.warn(`Text "${searchText}" not found. Rendering the entire search range.`);
                    startPage = startRange;
                    endPage = endRange;
                }

                // If endPage is not found, render until the last page of the search range
                if (endPage === null) {
                    endPage = endRange;
                }

                // Ensure startPage and endPage are valid
                if (startPage < 1 || startPage > totalPages) {
                    throw new Error(`Invalid start page: ${startPage}. Valid range is 1 to ${totalPages}.`);
                }
                if (endPage < 1 || endPage > totalPages) {
                    throw new Error(`Invalid end page: ${endPage}. Valid range is 1 to ${totalPages}.`);
                }

                // Render pages from startPage to endPage
                for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {    
                    try {
                        const page = await pdf.getPage(pageNumber);

                        if (subject === 'Design & Communication Graphics'){
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map((item) => item.str).join(' ');
                            
                            if (question.includes('Section A - Core')) {
                                // Skip rendering pages containing specific phrases
                                if (pageText.includes('Question B') || pageText.includes('Question C') || 
                                    pageText.includes('Assessment Sheet')) {
                                    console.log(`Skipping page ${pageNumber} due to excluded phrases.`);
                                    continue;
                                }
                            } else if (question.includes('Section B - Core')) {
                                // Skip rendering pages containing specific phrases
                                if (pageText.includes('SECTION A') || pageText.includes('Question A') || 
                                    pageText.includes('Question C') || pageText.includes('Assessment Sheet') ||
                                    pageText.includes('QUESTION C')) {
                                    console.log(`Skipping page ${pageNumber} due to excluded phrases.`);
                                    continue;
                                }
                            } else if (question.includes('Section C - Applied Graphics')) {
                                // Skip rendering pages containing specific phrases
                                if (pageText.includes('SECTION A') || pageText.includes('Question B') || 
                                    pageText.includes('Question A') || pageText.includes('Assessment Sheet')) {
                                    console.log(`Skipping page ${pageNumber} due to excluded phrases.`);
                                    continue;
                                }
                            }
                        } 

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

                // If PDF loading fails, show the marking link or provide manual instructions
                if (markingLink) {
                    setError(
                        <p className="text-red-500">
                            Failed to load the PDF. Please access the marking scheme directly:{' '}
                            <a href={markingLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                Open Marking Scheme
                            </a>
                        </p>
                    );
                } else {
                    setError(
                        <p className="text-red-500">
                            Failed to load the PDF. Please manually open the {level ? 'Higher' : 'Ordinary'} Level{' '}
                            {subject} Paper {paper}, Question {question}.
                        </p>
                    );
                }
            }
        } catch (error) {
            console.error('Error loading PDF or searching text:', error);

            // If PDF loading fails, show the marking link or provide manual instructions
            if (markingLink) {
                setError(
                    <p className="text-red-500">
                        Failed to load the PDF. Please access the marking scheme directly:{' '}
                        <a href={markingLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                            Open Marking Scheme
                        </a>
                    </p>
                );
            } else {
                setError(
                    <p className="text-red-500">
                        Failed to load the PDF. Please manually open the {level ? 'Higher' : 'Ordinary'} Level{' '}
                        {subject} Paper {paper}, Question {question}.
                    </p>
                );
            }
        }
    };

    useEffect(() => {
        if (pdfUrl && question) {
            loadPdfAndSearchQuestion(pdfUrl, question);
        }
    }, [pdfUrl, question]);

    if (!question || !year) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-8 pb-24">
                <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6 mt-24">
                    <h1 className="text-4xl font-bold text-center text-black mb-4" style={{ paddingTop: '1rem' }}>Marking Scheme</h1>
                    <div className="text-center">
                        <p className="text-black">
                            Marking scheme view for {subject} coming soon!
                        </p>
                        <p className="text-black">
                            Please correct your exam question attempt.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-8 pb-24">
            <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6 mt-24">
                <h1 className="text-4xl font-bold text-center text-black mb-4" style={{ paddingTop: '1rem' }}>Marking Scheme</h1>
                {error && <div>{error}</div>}
                <div className="w-full max-w-6xl flex flex-col mb-40">
                    <div className="mb-4 flex justify-center">
                        <p className="text-xl font-semibold text-black">Please correct your attempt.</p>
                    </div>
                    <div className="w-full h-[60vh] overflow-auto" ref={pdfContainerRef}>
                        {/* PDF pages will be rendered here */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkingScheme;