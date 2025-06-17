//src/app/study/markingScheme/page.js
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import * as pdfjsLib from 'pdfjs-dist'; // Correct main import
import LoadingScreen from '../loadingScreen';

// Assuming findTextInPDF is correctly exported from this path
import { findTextInPDF } from '../examQuestion/page';

const MarkingScheme = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    let subjectParam = searchParams.get('subject'); // Use a different variable name
    const levelParam = searchParams.get('level');
    const yearParam = searchParams.get('year');
    const questionParam = searchParams.get('question');
    const paperParam = searchParams.get('paper');

    // State variables
    const [subject, setSubject] = useState('');
    const [level, setLevel] = useState(false);
    const [year, setYear] = useState('');
    const [question, setQuestion] = useState('');
    const [paper, setPaper] = useState('');

    const [pdfUrl, setPdfUrl] = useState('');
    const [error, setError] = useState(null);
    const [markingLink, setMarkingLink] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isWorkerReady, setIsWorkerReady] = useState(false); // Added for worker readiness
    const pdfContainerRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            console.log('[MARKINGSCHEME] pdfjsLib object:', pdfjsLib);
            console.log('[MARKINGSCHEME] Checking worker. Current pdfjsLib.GlobalWorkerOptions.workerSrc:', pdfjsLib.GlobalWorkerOptions.workerSrc);
            if (pdfjsLib.GlobalWorkerOptions.workerSrc) {
                console.log('[MARKINGSCHEME] Worker seems ready in MarkingScheme:', pdfjsLib.GlobalWorkerOptions.workerSrc);
                setIsWorkerReady(true);
            } else {
                console.warn('[MARKINGSCHEME] Worker not set by global setup (e.g. _app.js or layout.js). Check global setup logs.');
                // isWorkerReady will remain false, preventing PDF load attempts until worker is set.
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
        setQuestion(questionParam || '');
        setPaper(paperParam || '');
    }, [subjectParam, levelParam, yearParam, questionParam, paperParam]);


    useEffect(() => {
        if (subject && question && paper && year) {
            fetchMarkingScheme();
        } else {
            // If essential params are missing, don't attempt to fetch.
            // Handle appropriately, perhaps set an error or a specific UI state.
            if (!loading) { // Only set error if not already loading something essential.
                 // setError("Required information (subject, question, paper, year) is missing.");
                 // console.warn("MarkingScheme: Missing essential parameters to fetch marking scheme.");
            }
             // setLoading(false); // Potentially set loading to false if we determine nothing will be fetched.
        }
    }, [subject, question, paper, year]); // Depend on derived state variables

    const fetchMarkingScheme = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('[MARKINGSCHEME] Fetching marking scheme for subject:', subject);

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

            console.log('[MARKINGSCHEME] PDF links fetched:', pdfLinks);

            if (!pdfLinks || pdfLinks.length === 0) {
                const errorMsg = `No PDF link found for: ${subject}, Year: ${year}, Paper: ${paper}, Level: ${level ? 'Higher' : 'Ordinary'}.`;
                console.error(errorMsg);
                throw new Error(errorMsg);
            }

            const markingSchemeFileName = pdfLinks[0].file_name.replace(/^(.*?_\d{4})_(\d+)_/, '$1_');

            const { data: publicUrlData, error: storageError } = supabase.storage
                .from('marking_bucket')
                .getPublicUrl(markingSchemeFileName);
            
            if (storageError) {
                throw new Error(`Error getting public URL for ${markingSchemeFileName}: ${storageError.message}`);
            }
            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error(`Could not retrieve public URL for ${markingSchemeFileName}.`);
            }

            setPdfUrl(publicUrlData.publicUrl);

            if (pdfLinks[0].marking_link) {
                setMarkingLink(pdfLinks[0].marking_link);
            }
        } catch (error) {
            console.error('[MARKINGSCHEME] Error fetching marking scheme:', error);
            setError(
                <p className="text-red-500">
                    Error fetching marking scheme: {error.message}
                    <br/>
                    Please try again or contact support.
                </p>
            );
        } finally {
            setLoading(false);
        }
    };

    const loadPdfAndSearchQuestion = async (currentPdfUrl, searchQuestionText) => {
        if (!pdfContainerRef.current) {
            console.error("[MARKINGSCHEME] PDF container ref is not available.");
            return;
        }
        try {
            if (typeof window === 'undefined') return;

            // Critical check: Worker must be configured globally.
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                console.error('[MARKINGSCHEME] CRITICAL: GlobalWorkerOptions.workerSrc is NOT SET before getDocument!');
                setError(<p className="text-red-500">PDF Worker not configured. Cannot load PDF.</p>);
                // setLoading(false); // loading state is managed by fetchMarkingScheme
                return;
            }
            console.log('[MARKINGSCHEME] About to call getDocument. Worker src:', pdfjsLib.GlobalWorkerOptions.workerSrc);

            let urlToLoad = currentPdfUrl;
            if (!urlToLoad.endsWith('.pdf')) {
                urlToLoad += '.pdf';
            }
            console.log("[MARKINGSCHEME] Loading PDF from URL:", urlToLoad);

            while (pdfContainerRef.current.firstChild) {
                pdfContainerRef.current.removeChild(pdfContainerRef.current.firstChild);
            }

            const loadingTask = pdfjsLib.getDocument(urlToLoad);
            const pdf = await loadingTask.promise;
            let searchText = searchQuestionText; // Use the passed parameter
            let nextQuestionTextArray = ['Blank Page', 'Acknowledgements', 'Do not write on this page']; // Default end texts

            const totalPages = pdf.numPages;
            let startRange = 2; // Default start page for searching
            let endRange = totalPages -1; // Default end page for searching (often last page is blank/appendix)
            let cutoffPage;

            // Logic for finding cutoff page for Paper 1 / Paper 2 split in marking schemes
            // This might need adjustment based on typical marking scheme structures
            for (let pageNumber = Math.max(startRange, 3); pageNumber <= totalPages; pageNumber++) {
                try {
                    const page = await pdf.getPage(pageNumber);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ').toLowerCase();
                    
                    // Common phrases indicating start of Paper 2 or end of Paper 1 material
                    if (pageText.includes("paper 2") || pageText.includes("páipéar 2") || (subject === "English" && pageText.includes("paper ii"))) {
                        cutoffPage = pageNumber;
                        console.log(`[MARKINGSCHEME] Found potential Paper 2 start at page ${cutoffPage}: "${textContent.items.slice(0,10).map(i=>i.str).join(' ')}"`);
                        break;
                    }
                } catch (pageError) {
                    console.warn(`[MARKINGSCHEME] Error processing page ${pageNumber} for cutoff detection:`, pageError);
                }
            }
            console.log('[MARKINGSCHEME] Cutoff page detected at:', cutoffPage);

            if (Number(paper) === 1) {
                if (cutoffPage) {
                    endRange = cutoffPage -1; // Search only up to before Paper 2 starts
                }
            } else if (Number(paper) === 2) {
                if (cutoffPage) {
                    startRange = cutoffPage; // Start search from where Paper 2 begins
                } else {
                    // If no explicit "Paper 2" found, might assume it starts roughly halfway
                    // Or rely on searchText to find the Q1 of paper 2
                    console.warn("[MARKINGSCHEME] No explicit Paper 2 marker found. For Paper 2, search will start from default/mid-document.");
                     if (subject === 'Mathematics' || subject === 'English' || subject === "Irish") { // Subjects known to have combined marking schemes
                        startRange = Math.max(startRange, Math.floor(pdf.numPages / 2) - 5); // Heuristic
                     }
                }
            }
            console.log(`[MARKINGSCHEME] Search range for Paper ${paper}: Page ${startRange} to ${endRange}`);


            // Subject-specific searchText and nextQuestionText logic
            switch (subject) {
                case "Mathematics":
                case "Engineering":
                    if (year > 2015 && subject === "Mathematics") {
                        searchText = `Q${parseInt(searchQuestionText.match(/\d+/)[0])}`;
                        nextQuestionTextArray.push(`Q${parseInt(searchQuestionText.match(/\d+/)[0]) + 1}`);
                    } else {
                        // searchText remains searchQuestionText
                        nextQuestionTextArray.push(`Question ${parseInt(searchQuestionText.match(/\d+/)[0]) + 1}`);
                    }
                    break;
                case "English":
                    searchText = searchQuestionText.toUpperCase(); // English marking schemes often use uppercase for question titles
                    if (searchQuestionText.includes('Comprehending')) {
                        nextQuestionTextArray.push('SECTION II – COMPOSING');
                    } else if (searchQuestionText.includes('Composing')) {
                        searchText = 'SECTION II – COMPOSING'; // Start of composing section
                        nextQuestionTextArray.push('PAPER II', 'Paper 2'); // End of Paper 1 Composing
                    } else if (searchQuestionText.includes('The Single Text')) {
                        // searchText for specific text might be needed if "THE SINGLE TEXT" is too generic
                        nextQuestionTextArray.push('SECTION II – THE COMPARATIVE STUDY');
                    } else if (searchQuestionText.includes('The Comparative Study')) {
                        searchText = 'SECTION II – THE COMPARATIVE STUDY';
                        nextQuestionTextArray.push('UNSEEN POEM');
                    } else if (searchQuestionText.includes('Poetry')) {
                        searchText = 'POETRY ('; // Often starts with "POETRY (Prescribed)"
                        nextQuestionTextArray.push('APPENDIX 1', 'Appendix 1');
                    }
                    break;
                case "Physics":
                    if (searchQuestionText.includes('Section A')) {
                        searchText = 'Tick'; // Common start for Section A answers
                    } else if (searchQuestionText.includes('Section B')) {
                        searchText = '( h )'; // Often a distinct marker for Q5(h) or similar in Section B
                    }
                    startRange = Math.max(startRange, 4); // Physics schemes often have intro pages
                    break;
                case "Irish":
                    // searchText remains searchQuestionText as it's usually specific enough
                    if (searchQuestionText.includes('An Chluastuiscint')) {
                        nextQuestionTextArray.push('CEAPADÓIREACHT', 'An Cheapadóireacht');
                    } else if (searchQuestionText.includes('An Cheapadóireacht')) {
                        nextQuestionTextArray.push('MÍLÉAMH', 'Léamhthuiscint'); // Assuming Léamhthuiscint follows
                    } else if (searchQuestionText.includes('Léamhthuiscint')) {
                        nextQuestionTextArray.push('PRÓS', 'An Prós');
                    } else if (searchQuestionText.includes('Prós')) {
                        nextQuestionTextArray.push('FILÍOCHT', 'An Fhilíocht');
                    } else if (searchQuestionText.includes('Filíocht')) {
                        nextQuestionTextArray.push('SCÉIM MHARCÁLA MHODHNAITHE', 'Aguisín');
                    }
                    break;
                case "Polish":
                    if (searchQuestionText.includes('Pytanie 1')) {
                        searchText = 'Question 1'; // Marking schemes often use English "Question"
                        nextQuestionTextArray.push('Question 2');
                    } else if (searchQuestionText.includes('Pytanie 2')) {
                        searchText = 'Question 2';
                        nextQuestionTextArray.push('SECTION B');
                    } else if (searchQuestionText.includes('Pytanie 3') || searchQuestionText.includes('Pytanie 4') || searchQuestionText.includes('Pytanie 5')) {
                        searchText = 'SECTION B'; // General start for these questions
                        nextQuestionTextArray.push('LISTENING COMPREHENSION', 'TRANSCRIPT');
                    } else if (searchQuestionText.includes('Listening')) {
                        searchText = 'LISTENING COMPREHENSION';
                        nextQuestionTextArray.push('APPENDIX 1', 'Appendix 1');
                    }
                    break;
                case "Design & Communication Graphics":
                    if (searchQuestionText.includes('Section A - Core')) {
                        searchText = 'Question A';
                    } else if (searchQuestionText.includes('Section B - Core')) {
                        searchText = 'Question B';
                    } else if (searchQuestionText.includes('Section C - Applied Graphics')) {
                        searchText = 'Question C';
                    }
                    // For DCG, nextQuestionText might simply be the next question letter, or end of section.
                    // findTextInPDF will use default end options if specific ones aren't hit.
                    break;
                case "Spanish":
                     // searchText remains searchQuestionText
                    if (searchQuestionText.includes('Section A')) { // Usually "TEXTO 1" or "PREGUNTAS"
                        nextQuestionTextArray.push('Section B', 'SECCIÓN B');
                    } else if (searchQuestionText.includes('Section B')) { // Usually "Diálogo" or specific task
                        nextQuestionTextArray.push('Section C', 'SECCIÓN C');
                    } else if (searchQuestionText.includes('Section C')) { // Usually "Redacción" or writing task
                        nextQuestionTextArray.push('Listening', 'AUDICIÓN', 'TRANSCRIPCIÓN');
                    } else if (searchQuestionText.includes('Listening')) {
                        searchText = 'ANUNCIO'; // Common start for listening
                        if (year > 2021) {
                            nextQuestionTextArray.push('APPENDIX ONE', 'Appendix 1');
                        } else {
                            nextQuestionTextArray.push('PRESCRIBED LITERATURE', 'Apéndice');
                        }
                    }
                    break;
                default:
                    // Default behavior: use question as searchText, generic nextQuestionTextArray
                    break;
            }
            
            console.log(`[MARKINGSCHEME] Searching for text: "${searchText}", with end options:`, nextQuestionTextArray, `within pages ${startRange}-${endRange}`);
            let { startPage, endPage } = await findTextInPDF(pdf, searchText, nextQuestionTextArray, startRange);

            if (startPage === null) {
                console.warn(`[MARKINGSCHEME] Text "${searchText}" not found. Rendering the determined search range ${startRange}-${endRange}.`);
                startPage = startRange; // Render the whole relevant section if specific text not found
                endPage = endRange;
            }
            if (endPage === null || endPage < startPage) { // If end text not found or found before start
                console.warn(`[MARKINGSCHEME] End text not found or found before start. Setting endPage to ${endRange}.`);
                endPage = endRange;
            }

            // Ensure page numbers are within PDF bounds
            startPage = Math.max(1, Math.min(startPage, totalPages));
            endPage = Math.max(1, Math.min(endPage, totalPages));
             if (startPage > endPage) { // Final safety check
                console.warn(`[MARKINGSCHEME] Corrected startPage (${startPage}) is greater than endPage (${endPage}). Rendering only startPage.`);
                endPage = startPage;
            }


            console.log(`[MARKINGSCHEME] Rendering pages from ${startPage} to ${endPage}`);
            if (pdfContainerRef.current.children.length === 0 && (startPage > endPage) ) {
                 pdfContainerRef.current.innerHTML = `<p class="text-center text-gray-500 p-10">Could not find the specified content for ${searchQuestionText}.</p>`;
            }


            for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
                try {
                    const page = await pdf.getPage(pageNumber);

                    // DCG specific filtering logic (already present in original)
                    if (subject === 'Design & Communication Graphics') {
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item) => item.str).join(' ').toLowerCase();
                        let skipPage = false;
                        if (searchQuestionText.includes('Section A - Core')) {
                            if (pageText.includes('question b') || pageText.includes('question c') ||
                                pageText.includes('assessment sheet')) {
                                skipPage = true;
                            }
                        } else if (searchQuestionText.includes('Section B - Core')) {
                            if (pageText.includes('section a') || pageText.includes('question a') ||
                                pageText.includes('question c') || pageText.includes('assessment sheet') ||
                                pageText.includes('question c')) { // QUESTION C was repeated, check if intentional
                                skipPage = true;
                            }
                        } else if (searchQuestionText.includes('Section C - Applied Graphics')) {
                            if (pageText.includes('section a') || pageText.includes('question b') ||
                                pageText.includes('question a') || pageText.includes('assessment sheet')) {
                                skipPage = true;
                            }
                        }
                        if (skipPage) {
                            console.log(`[MARKINGSCHEME] DCG: Skipping page ${pageNumber} due to content filter for "${searchQuestionText}".`);
                            continue;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.className = 'pdf-page-canvas'; // Ensure full width and spacing
                    const context = canvas.getContext('2d');
                    pdfContainerRef.current.appendChild(canvas);

                    const viewport = page.getViewport({ scale: 1.1 });
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                    }).promise;
                } catch (pageRenderError) {
                    console.error(`[MARKINGSCHEME] Error rendering page ${pageNumber}:`, pageRenderError);
                }
            }

            if (startPage !== null && pdfContainerRef.current.children.length > 0) {
                pdfContainerRef.current.children[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (pdfContainerRef.current.children.length === 0) {
                 pdfContainerRef.current.innerHTML = `<p class="text-center text-gray-500 p-10">No content found or rendered for ${searchQuestionText}.</p>`;
            }

        } catch (err) {
            console.error('[MARKINGSCHEME] Error in loadPdfAndSearchQuestion:', err);
            let errorContent = `<p class="text-red-500">Failed to load or process the PDF. Details: ${err.message}</p>`;
            if (markingLink) {
                errorContent += `
                    <p class="text-red-500">
                        Please try accessing the marking scheme directly: 
                        <a href="${markingLink}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">
                            Open Marking Scheme
                        </a>
                    </p>`;
            } else {
                 errorContent += `
                    <p class="text-red-500">
                        Please manually open the ${level ? 'Higher' : 'Ordinary'} Level 
                        ${subject} Paper ${paper}, Question ${searchQuestionText} marking scheme.
                    </p>`;
            }
            // Use dangerouslySetInnerHTML if you need to render HTML, otherwise set textContent
             if (pdfContainerRef.current) {
                pdfContainerRef.current.innerHTML = errorContent; // Clears "Loading PDF..."
            } else {
                // If ref is somehow null, set the main error state
                setError( <div dangerouslySetInnerHTML={{ __html: errorContent }} /> );
            }
        }
    };

    useEffect(() => {
        if (isWorkerReady && pdfUrl && question) {
            console.log('[MARKINGSCHEME] Worker is ready, PDF URL and question are set. Proceeding to load PDF.');
            // Clear previous content / error messages shown in pdfContainerRef
            if (pdfContainerRef.current) {
                pdfContainerRef.current.innerHTML = '<p class="text-center text-gray-500 p-10">Loading PDF content...</p>';
            }
            setError(null); // Clear main error display
            loadPdfAndSearchQuestion(pdfUrl, question);
        } else if (pdfUrl && question && !isWorkerReady) {
            console.warn('[MARKINGSCHEME] PDF URL and question are set, but worker is NOT ready. PDF will not load yet.');
            if (pdfContainerRef.current) { // Show a message indicating worker issue if it's the blocker
                 pdfContainerRef.current.innerHTML = '<p class="text-center text-orange-500 p-10">PDF system is initializing. Please wait a moment...</p>';
            }
        }
    }, [isWorkerReady, pdfUrl, question, paper, subject, year, level]); // Added more relevant dependencies


    if (!questionParam || !yearParam || !subjectParam || !paperParam) { // Use params for this initial check
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-8 pb-24">
                <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6 mt-24">
                    <h1 className="text-4xl font-bold text-center text-gray-800 mb-4" style={{ paddingTop: '1rem' }}>Marking Scheme</h1>
                    <div className="text-center">
                        <p className="text-gray-700">
                            Marking scheme view for {subjectParam || "the selected exam"} is loading or required information is missing in the URL.
                        </p>
                        <p className="text-gray-600">
                            Please ensure the link includes subject, year, paper, and question.
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
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center p-4 md:p-8 pb-24">
            <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl p-4 md:p-8 space-y-6 mt-20 md:mt-24">
                <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-4" style={{ paddingTop: '1rem' }}>Marking Scheme</h1>
                {error && <div className="text-center p-4 bg-red-100 text-red-700 rounded mb-4">{error}</div>}
                
                <div className="w-full"> {/* Removed max-w-6xl and flex */}
                    <div className="mb-4 text-center">
                        <p className="text-lg md:text-xl font-semibold text-gray-700">
                            Please correct your attempt at {question}.
                        </p>
                    </div>
                    <div 
                        className="w-full h-[70vh] overflow-auto border border-gray-300 rounded bg-gray-50" 
                        ref={pdfContainerRef} 
                        aria-live="polite"
                    >
                        {/* PDF pages will be rendered here. Initial message if empty: */}
                        {!pdfContainerRef.current?.firstChild && !error && <p className="text-center text-gray-500 p-10">Loading PDF content or no content to display...</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkingScheme;