//src/app/study/layout.js
"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import '../globals.css';

// Reusable Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <p className="text-lg mb-4 text-black">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- AI Side Panel Component (Modified from AiHelperModal) ---
const AiHelperPanel = ({ isOpen, onClose, onSubmit, isLoading, response, error, subjectContext }) => {
    const [prompt, setPrompt] = useState('');
    const [isMathSymbolsOpen, setIsMathSymbolsOpen] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (prompt.trim()) {
            onSubmit(prompt);
            // Optionally clear prompt after submit: setPrompt('');
        }
    };

    // Insert Math Symbol Function
    const insertMathSymbol = (symbol) => {
        const textarea = document.querySelector('#ai-prompt-textarea'); // Add ID for easier selection
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const newValue = before + symbol + after;
        textarea.value = newValue; // Directly set value first
        setPrompt(newValue); // Update state

        // Focus and set cursor position after state update might be more reliable
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
        });
    };


    // The main container is now the panel itself
    return (
        <div
            className={`fixed top-0 left-0 h-screen w-full sm:w-96 md:w-[450px]  // Width adjustments
                      bg-white shadow-xl z-50 p-6                               // Styling
                      transition-transform duration-300 ease-in-out           // Animation
                      ${isOpen ? 'translate-x-0' : '-translate-x-full'}         // Sliding logic
                      flex flex-col                                             // Internal layout
                      border-r border-gray-200`}                                // Optional border
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800">Ask 625 AI</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl p-1 rounded-full hover:bg-gray-100">×</button>
            </div>

            {/* Display Context */}
            {subjectContext && (
                <div className="text-sm text-gray-600 mb-3 border-b pb-2 flex-shrink-0">
                    <strong>Context:</strong> LC {subjectContext.level?.charAt(0).toUpperCase() + subjectContext.level?.slice(1)} {subjectContext.subject} {subjectContext.year && `(${subjectContext.year})`}
                    {subjectContext.paper && subjectContext.question && (
                        <>
                            {` - P${subjectContext.paper}`}
                            {` - Q${subjectContext.question}`}
                        </>
                    )}
                </div>
            )}

            {/* Response Area - Make it scrollable */}
            <div className="mb-4 flex-grow overflow-y-auto bg-gray-50 p-3 rounded border border-gray-200">
                {isLoading && <p className="text-center text-gray-500">Thinking...</p>}
                {error && <p className="text-red-600 whitespace-pre-wrap">Error: {error}</p>}
                {response && (
                    <p
                        className="text-gray-800 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                            __html: response
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
                        }}
                    ></p>
                )}
                {!isLoading && !response && !error && (
                    <p className="text-black">
                        Ask a question below about the current topic or a general study query.
                    </p>
                )}
            </div>

            {/* Input Form Area - Fixed at bottom */}
            <div className="flex-shrink-0 relative">
                {/* Math Symbols Pop-Out - Position above the textarea */}
                {isMathSymbolsOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-[150px] bg-gray-100 border border-gray-200 rounded shadow-lg p-2 z-10">
                        <h3 className="text-xs font-semibold mb-1 text-center">Math Symbols</h3>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {['+', '-', '*', '/', '=', '≠', '≤', '≥', '√', 'π', '∞', '^2', '°', '∫', '∑'].map((symbol) => ( // Added more symbols
                                <button
                                    key={symbol}
                                    type="button"
                                    onClick={() => insertMathSymbol(symbol)}
                                    className="px-2 py-0.5 bg-gray-200 text-black text-sm rounded hover:bg-gray-300 transition"
                                >
                                    {symbol}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <textarea
                        id="ai-prompt-textarea" // Added ID
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Type your question here..."
                        className="w-full p-2 text-black border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        disabled={isLoading}
                    />
                    <div className="flex justify-between items-center">
                        {/* Button to Toggle Math Symbols Pop-Out */}
                        <button
                            type="button"
                            onClick={() => setIsMathSymbolsOpen(!isMathSymbolsOpen)}
                            title="Show/Hide Math Symbols"
                            className="px-3 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition"
                        >
                            <span className="text-lg">∑</span> {/* Example symbol */}
                        </button>

                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                                disabled={isLoading}
                            >
                                Close
                            </button>
                            <button
                                type="submit"
                                className={`px-4 py-2 rounded transition ${isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'}`}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Asking...' : 'Ask AI'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
// --- End AI Side Panel Component ---


const StudyLayout = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [isPaused, setIsPaused] = useState(false);
    const [time, setTime] = useState(0);
    const [initialTime, setInitialTime] = useState(0);
    const [totalStudyTime, setTotalStudyTime] = useState(0);
    const [subject, setSubject] = useState('');
    const [exam, setExam] = useState('');
    const [paper, setPaper] = useState('');
    const [question, setQuestion] = useState('');
    const [year, setYear] = useState('');
    const [level, setLevel] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [url, setUrl] = useState(''); // Use state for URL
    const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
    const [isConfirmFinishOpen, setIsConfirmFinishOpen] = useState(false);

    // --- AI State ---
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    // --- End AI State ---

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setUrl(window.location.href);
        }

        const overallTimeFromUrl = parseInt(searchParams.get('overallTime'), 10) || 0;
        setTime(overallTimeFromUrl);
        setInitialTime(overallTimeFromUrl);

        // Populate state from searchParams for use in toggle buttons and other logic
        setSubject(searchParams.get('subject') || '');
        setLevel(searchParams.get('level') || '');
        setExam(searchParams.get('exam') || '');
        setPaper(searchParams.get('paper') || '');
        setQuestion(searchParams.get('question') || '');
        setYear(searchParams.get('year') || '');
    }, [pathname, searchParams]);

    useEffect(() => {
        if (subject && url) {
            fetchTotalStudyTime();
            fetchAudioFile();
        }
    }, [subject, year, level, url]);


    useEffect(() => {
        let timer;
        if (!isPaused && url && !url.includes('guidedStart')) {
            timer = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPaused, url]);

    const fetchTotalStudyTime = async () => {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('User not authenticated. Please log in.');
            return;
        }
        const supabaseUserId = user.id;
        const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('study_time')
            .eq('supabase_user_id', supabaseUserId)
            .single();
        if (userDataError) {
            console.error('Error fetching user data:', userDataError);
            return;
        }
        if (userData && typeof userData.study_time === 'number') {
            setTotalStudyTime(userData.study_time * 60);
        } else {
            console.warn('Study time not found or invalid for user.');
            setTotalStudyTime(0);
        }
    };

    const fetchAudioFile = async () => {
        console.log('Fetching audio file...');
        if (!url) {
            console.log('URL not ready yet for audio fetch.');
            return;
        }
        console.log('Current URL:', url);
        if ((url.includes('Chluas') || url.includes('Listening')) && !url.includes('guidedStart')) {
            console.log('URL contains Chluas or Listening');
            if (!subject || !year || !level) {
                console.warn('Missing context for audio file name (subject, year, or level).');
                setAudioUrl('');
                return;
            }
            const audioFileName = `${subject}_${year}_0_${level === "higher" ? 'Higher' : 'Ordinary'}.mp3`;
            console.log('Audio file name:', audioFileName);
            const { data: audioPublicUrlData, error } = supabase.storage
                .from('exam_bucket')
                .getPublicUrl(audioFileName);
            if (error) {
                console.error('Error fetching audio file URL:', error);
                setAudioUrl('');
                return;
            }
            if (audioPublicUrlData && audioPublicUrlData.publicUrl) {
                console.log('Audio file URL:', audioPublicUrlData.publicUrl);
                setAudioUrl(audioPublicUrlData.publicUrl);
            } else {
                console.error('Could not get public URL for audio file.');
                setAudioUrl('');
            }
        } else {
            console.log('URL does not contain Chluas or Listening');
            setAudioUrl('');
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}`;
    };

    const handlePauseResume = () => {
        setIsPaused(!isPaused);
    };

    const handleReset = () => {
        setIsConfirmResetOpen(true);
    };

    const confirmReset = () => {
        setTime(initialTime);
        setIsPaused(false);
        setIsConfirmResetOpen(false);
    };

    const handleSubmit = async () => {
        if (!url) {
            console.error('URL state not ready for submit.');
            return;
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('User not authenticated. Please log in.');
            return;
        }
        const supabaseUserId = user.id;
        const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('id')
            .eq('supabase_user_id', supabaseUserId)
            .single();
        if (userDataError) {
            console.error('Error fetching user data:', userDataError);
            return;
        }
        const userId = userData.id;

        if (url.includes('examQuestion') || url.includes('markingScheme')) {
            console.log(`subject: ${subject}, level: ${level}, exam: ${exam}, paper: ${paper}, question: ${question}, year: ${year}`);
            if (subject && exam && level) { // level state here is string 'higher' or 'ordinary'
                console.log(`Fetching exam data for subject: ${subject}, exam: ${exam}, level: ${level}`);
                try {
                    // Ensure 'exam' state has the correct value like "Paper 1", "Paper 2"
                    const { data: examData, error: examDataError } = await supabase
                        .from('exams')
                        .select('id')
                        .eq('subject', subject)
                        .eq('exam', exam) // Use the 'exam' state which should be populated
                        .single();
                    if (examDataError) console.log('Error fetching exam data:', examDataError);
                    if (!examData) throw new Error('Exam not found. Verify params.');
                    const examId = examData.id;
                    const timeSpent = time - initialTime;
                    console.log(`userId: ${userId}, examId: ${examId}, timeSpent: ${timeSpent}`);
                    if (timeSpent > 0) {
                        const { data: examStudyData, error: examStudySelectError } = await supabase
                            .from('user_exam_study').select('time').eq('user_id', userId).eq('exam_id', examId).maybeSingle();
                        if (examStudySelectError) throw new Error('Failed to fetch user exam study data.');
                        if (examStudyData) {
                            const newTimeSpent = examStudyData.time + timeSpent;
                            const { error: updateError } = await supabase.from('user_exam_study').update({ time: newTimeSpent }).eq('user_id', userId).eq('exam_id', examId);
                            if (updateError) throw new Error('Failed to update user exam study time.');
                        } else {
                            const { error: insertError } = await supabase.from('user_exam_study').insert({ user_id: userId, exam_id: examId, time: timeSpent });
                            if (insertError) throw new Error('Failed to insert user exam study time.');
                        }
                        console.log(`Recorded ${timeSpent} seconds for exam ID ${examId}`);
                    } else {
                        console.log('No time spent on this page, skipping time record.');
                    }
                } catch (error) {
                    console.error('Error processing exam study time:', error.message || error);
                    alert(error.message || 'An unexpected error occurred.');
                }
            } else {
                console.warn("Missing subject, exam type, or level for exam time tracking.");
            }
        }

        // Navigation Logic uses current `time` state
        let nextUrl = '';
        const currentParams = { overallTime: time.toString(), subject, level, exam, paper, question, year };
        const buildQueryString = (params) => new URLSearchParams(
            Object.entries(params).filter(([, value]) => value != null && value !== '').reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {})
        ).toString();


        if (url.includes('guidedStart')) {
            nextUrl = `/study/addFlashcards?${buildQueryString({ overallTime: time.toString(), subject, level })}`;
        } else if (url.includes('addFlashcards')) {
            if (url.includes('type=flashcard')) {
                nextUrl = `/study/reviewFlashcards?${buildQueryString({ ...currentParams, type: 'flashcard' })}`;
            } else if (paper) { // Check if paper exists, indicating exam flow
                nextUrl = `/study/examRedirect?${buildQueryString(currentParams)}`;
            } else {
                nextUrl = `/study/reviewFlashcards?${buildQueryString({ overallTime: time.toString(), subject, level })}`;
            }
        } else if (url.includes('reviewFlashcards')) {
            if (time >= 1800 && time < 1830) {
                nextUrl = `/study/sessionCompleted?${buildQueryString(currentParams)}`;
            } else if (url.includes('type=flashcard')) {
                handleFinishStudying(); return; // Exit after calling finish
            } else { // Assumes exam flow if not flashcard-only
                nextUrl = `/study/examRedirect?${buildQueryString(currentParams)}`;
            }
        } else if (url.includes('examPaperStart')) {
            nextUrl = `/study/examQuestion?${buildQueryString(currentParams)}`;
        } else if (url.includes('examQuestion')) { // This is where the original "Next" from ExamQuestion leads
            nextUrl = `/study/markingScheme?${buildQueryString(currentParams)}`;
        } else if (url.includes('markingScheme')) { // This is where the original "Next" from MarkingScheme leads
            if (question && subject && year && paper && level && userId) { /* ... mark question done ... */ }
            if (time >= 1800 && time < 1830) {
                nextUrl = `/study/sessionCompleted?${buildQueryString(currentParams)}`;
            } else {
                nextUrl = `/study/examRedirect?${buildQueryString(currentParams)}`;
            }
        } else if (url.includes('sessionCompleted')) {
            nextUrl = `/study/examRedirect?${buildQueryString(currentParams)}`;
        } else {
            console.log("Submit clicked on page without specific next step logic:", url);
        }
        if (nextUrl) router.push(nextUrl);
    };

    const handleFinishStudying = () => {
        setIsConfirmFinishOpen(true);
    };

    const confirmFinishStudying = async () => {
        // ... (keep existing confirmFinishStudying logic, it uses current `time` state correctly) ...
        setIsPaused(true);
        setIsConfirmFinishOpen(false);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated.');
            const supabaseUserId = user.id;
            const { data: userData } = await supabase.from('users').select('id, study_time_today, streak, last_time_studied').eq('supabase_user_id', supabaseUserId).single();
            if (!userData) throw new Error('User data not found.');
            const userId = userData.id;
            if (typeof time !== 'number' || time < 0) throw new Error('Invalid study time detected.');
            if (time <= 0) { router.push('/dashboard'); return; }
            const studyTimeMinutes = Math.max(0, Math.floor(time / 60));
            let newStudyTimeToday = (userData.study_time_today || 0) + studyTimeMinutes;
            let newStreak = userData.streak || 0;
            const lastTimeStudied = userData.last_time_studied ? new Date(userData.last_time_studied) : null;
            const now = new Date();
            const todayDateString = now.toDateString();
            if (lastTimeStudied) {
                const lastStudyDateString = lastTimeStudied.toDateString();
                if (lastStudyDateString !== todayDateString) {
                    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
                    newStreak = (lastStudyDateString === yesterday.toDateString()) ? newStreak + 1 : 1;
                    newStudyTimeToday = studyTimeMinutes;
                } else {
                    if (newStreak === 0) newStreak = 1;
                }
            } else {
                newStreak = 1; newStudyTimeToday = studyTimeMinutes;
            }
            await supabase.from('users').update({ study_time_today: newStudyTimeToday, streak: newStreak, last_time_studied: now.toISOString() }).eq('id', userId);
            if (subject && studyTimeMinutes > 0) {
                const { data: existingRecord } = await supabase.from('user_study_data').select('*').eq('user_id', userId).eq('subject', subject).maybeSingle(); // use maybeSingle
                if (existingRecord) {
                    await supabase.from('user_study_data').update({ time_spent: existingRecord.time_spent + studyTimeMinutes, calc_time: existingRecord.calc_time + studyTimeMinutes }).eq('user_id', userId).eq('subject', subject);
                } else {
                    await supabase.from('user_study_data').insert({ user_id: userId, subject: subject, time_spent: studyTimeMinutes, calc_time: studyTimeMinutes });
                }
            }
            router.push('/dashboard');
        } catch (error) {
            console.error('Error in confirmFinishStudying:', error);
            alert(`An error occurred: ${error.message}. Please try again.`);
            setIsPaused(false);
        }
    };

    // --- AI Handlers ---
    const handleOpenAiModal = () => { /* ... */ setIsAiModalOpen(true); setAiError(''); };
    const handleCloseAiModal = () => setIsAiModalOpen(false);
    const handleAskAi = async (userPrompt) => { /* ... (existing logic) ... */
        setIsAiLoading(true); setAiResponse(''); setAiError('');
        const context = { subject, level, year, paper, question };
        const validContext = Object.entries(context).reduce((acc, [key, value]) => { if (value) acc[key] = value; return acc; }, {});
        try {
            const response = await fetch('/api/gemini', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userPrompt, context: Object.keys(validContext).length > 0 ? validContext : null }),
            });
            if (!response.ok) { const errorData = await response.json().catch(() => ({ error: 'Failed to parse error' })); throw new Error(errorData.error || `HTTP error ${response.status}`); }
            const data = await response.json(); setAiResponse(data.response);
        } catch (error) { console.error('Error AI:', error); setAiError(error.message || 'Failed AI response'); }
        finally { setIsAiLoading(false); }
    };
    // --- End AI Handlers ---

    // --- NEW NAVIGATION FUNCTION FOR TOGGLING ---
    const handleToggleView = () => {
        if (!subject || !level || !exam || !paper || !question || !year) {
            console.error("Missing parameters for toggling view. Current state:", { subject, level, exam, paper, question, year });
            // Potentially alert the user or disable the button if params are missing
            return;
        }

        const queryParams = new URLSearchParams({
            overallTime: time.toString(), // CRITICAL: Use the current `time` state from StudyLayout
            subject: subject,
            level: level,
            exam: exam,
            paper: paper,
            question: question,
            year: year,
        }).toString();

        if (pathname.includes('/study/examQuestion')) {
            router.push(`/study/markingScheme?${queryParams}`);
        } else if (pathname.includes('/study/markingScheme')) {
            router.push(`/study/examQuestion?${queryParams}`);
        } else {
            console.warn("Toggle view button clicked on an unexpected page:", pathname);
        }
    };
    // --- END NEW NAVIGATION FUNCTION ---

    // Determine if the toggle button should be shown and what its text should be
    const showToggleButton = pathname.includes('/study/examQuestion') || pathname.includes('/study/markingScheme');
    let toggleButtonText = '';
    if (pathname.includes('/study/examQuestion')) {
        toggleButtonText = 'View Marking Scheme';
    } else if (pathname.includes('/study/markingScheme')) {
        toggleButtonText = 'View Question Paper';
    }

    return (
        <div className="min-h-screen flex flex-col justify-between pb-20 sm:pb-16">
            <div>
                {children}
            </div>

            {/* AI Trigger Button & Panel & Overlay ... */}
            {!audioUrl && (
                <button
                    type="button" onClick={handleOpenAiModal}
                    className={`fixed left-0 top-1/2 transform -translate-y-1/2 z-30 w-14 h-36 bg-gradient-to-br from-blue-600 to-green-400 text-white shadow-lg hover:shadow-glow hover:scale-105 transition-all duration-300 ease-in-out flex items-center justify-center group ${isAiModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    style={{ clipPath: 'polygon(0 0, 100% 10%, 100% 90%, 0% 100%)', transform: 'translateX(0%) translateY(-50%)' }}
                    aria-label="Ask AI Helper" title="Ask AI Helper" >
                    <div className="relative z-10 group-hover:scale-[1.03] transition-transform duration-300 text-center leading-tight" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        <span className="text-lg font-semibold">625 AI</span>
                    </div>
                </button>
            )}
            <AiHelperPanel isOpen={isAiModalOpen} onClose={handleCloseAiModal} onSubmit={handleAskAi} isLoading={isAiLoading} response={aiResponse} error={aiError} subjectContext={{ subject, level, year, paper, question }} />
            {isAiModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleCloseAiModal}></div>)}


            {/* Bottom Control Bar */}
            <div className="bg-white text-black p-4 flex flex-col sm:flex-row justify-between items-center fixed bottom-0 w-full border-t border-gray-300 z-20">
                {/* Left Section: Time and Controls */}
                <div className="flex items-center flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 mb-2 sm:mb-0 w-full sm:w-auto">
                    <span className="text-lg font-semibold whitespace-nowrap order-1 sm:order-none">
                        {formatTime(time)} {totalStudyTime > 0 ? `/ ${formatTime(totalStudyTime)}` : ''}
                    </span>
                    <button type="button" onClick={handlePauseResume} className="px-3 py-1 bg-white text-black border border-black rounded hover:bg-gray-100 transition whitespace-nowrap min-w-[45px] h-[36px] flex items-center justify-center text-lg order-2 sm:order-none shadow" style={{ width: '45px' }} aria-label={isPaused ? "Resume Timer" : "Pause Timer"}>
                        {isPaused ? '▶' : '⏸'}
                    </button>
                    <button type="button" onClick={handleReset} className="px-3 py-1 bg-white text-black border border-black rounded hover:bg-gray-100 transition whitespace-nowrap flex items-center justify-center text-sm order-3 sm:order-none shadow h-[36px]" aria-label={`Reset Timer to ${formatTime(initialTime)}`}>
                        <span className="text-lg mr-1">↺</span> to {formatTime(initialTime)}
                    </button>
                </div>

                {/* --- NEW TOGGLE BUTTON --- */}
                {showToggleButton && (
                    <div className="my-2 sm:my-0 order-none mx-auto sm:mx-2"> {/* Adjusted margin */}
                        <button
                            type="button"
                            onClick={handleToggleView}
                            className="px-4 h-[36px] flex items-center justify-center bg-purple-600 text-white rounded hover:bg-purple-700 transition whitespace-nowrap text-sm shadow"
                        >
                            {toggleButtonText}
                        </button>
                    </div>
                )}
                {/* --- END NEW TOGGLE BUTTON --- */}

                {audioUrl && (
                    <div className={`bg-white rounded my-2 sm:my-0 order-last sm:order-none ${showToggleButton ? 'sm:mx-2' : 'mx-auto sm:mx-4'} flex-shrink-0`}> {/* Adjusted margin */}
                        <audio controls src={audioUrl} className="max-w-full h-10">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}

                {/* Right Section: Action Buttons */}
                <div className="flex items-center flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto order-first sm:order-last">
                    {url.includes('markingScheme') && (
                        <button
                            type="button"
                            onClick={() => router.push(`/study/addFlashcards?overallTime=${time}&subject=${encodeURIComponent(subject)}&level=${level}&exam=${exam}&paper=${paper}&question=${question}&year=${year}`)}
                            className="px-4 h-[36px] flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-700 transition whitespace-nowrap text-sm shadow"
                        >
                            Add Flashcard
                        </button>
                    )}
                    {!(url.includes('sessionCompleted') || (url.includes('reviewFlashcards') && url.includes('type=flashcard'))) && (
                        <button type="button" onClick={handleSubmit} className="px-4 h-[36px] flex items-center justify-center bg-green-500 text-white rounded hover:bg-green-700 transition whitespace-nowrap text-sm shadow" >
                            Next
                        </button>
                    )}
                    <button type="button" onClick={handleFinishStudying} className="px-4 h-[36px] flex items-center justify-center bg-yellow-500 text-white rounded hover:bg-yellow-600 transition whitespace-nowrap text-sm shadow" >
                        Finish Studying
                    </button>
                </div>
            </div>

            {/* Confirmation Modals */}
            <ConfirmationModal isOpen={isConfirmResetOpen} onClose={() => setIsConfirmResetOpen(false)} onConfirm={confirmReset} message={`Are you sure you want to reset the timer to ${formatTime(initialTime)}?`} />
            <ConfirmationModal isOpen={isConfirmFinishOpen} onClose={() => setIsConfirmFinishOpen(false)} onConfirm={confirmFinishStudying} message="Are you sure you want to finish studying?" />
        </div>
    );
};

export default StudyLayout;