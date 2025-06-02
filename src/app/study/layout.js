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
                <p className="text-lg mb-4">{message}</p>
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
    const [isAiModalOpen, setIsAiModalOpen] = useState(false); // Keep state name, but it controls the panel
    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    // --- End AI State ---

    useEffect(() => {
        // Set URL state once window is available
        if (typeof window !== 'undefined') {
            setUrl(window.location.href);
        }

        const overallTime = parseInt(searchParams.get('overallTime'), 10) || 0;
        setTime(overallTime);
        setInitialTime(overallTime);
        setSubject(searchParams.get('subject') || '');
        setLevel(searchParams.get('level') || '');
        setExam(searchParams.get('exam') || '');
        setPaper(searchParams.get('paper') || '');
        setQuestion(searchParams.get('question') || '');
        setYear(searchParams.get('year') || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]); // Depend on searchParams as well

    useEffect(() => {
        // Fetch these only when subject changes or initially
        if (subject && url) { // Ensure URL is also ready
            fetchTotalStudyTime();
            fetchAudioFile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subject, year, level, url]); // Add dependencies that affect audio file name


    useEffect(() => {
        let timer;
        if (!isPaused && url && !url.includes('guidedStart')) { // Ensure URL is ready
            timer = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPaused, url]); // Add url dependency

    // --- Keep existing functions: fetchTotalStudyTime, fetchAudioFile, formatTime, ---
    // --- handlePauseResume, handleReset, handleSubmit, handleFinishStudying ---
    const fetchTotalStudyTime = async () => {
        // ... (keep existing fetchTotalStudyTime logic)
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
            // Don't set total time if error
            return;
        }
        // Make sure study_time exists and is a number
        if (userData && typeof userData.study_time === 'number') {
            setTotalStudyTime(userData.study_time * 60);
        } else {
            console.warn('Study time not found or invalid for user.');
            setTotalStudyTime(0); // Default or handle as appropriate
        }
    };

    const fetchAudioFile = async () => {
        console.log('Fetching audio file...');
        // Ensure URL state is set before using it
        if (!url) {
            console.log('URL not ready yet for audio fetch.');
            return;
        }
        console.log('Current URL:', url);
        if (url.includes('Chluas') || url.includes('Listening')) {
            console.log('URL contains Chluas or Listening');
            // Make sure all components of the filename are available
            if (!subject || !year || !level) {
                console.warn('Missing context for audio file name (subject, year, or level).');
                setAudioUrl(''); // Reset audio URL if context is missing
                return;
            }
            const audioFileName = `${subject}_${year}_0_${level === "higher" ? 'Higher' : 'Ordinary'}.mp3`;
            console.log('Audio file name:', audioFileName);
            const { data: audioPublicUrlData, error } = supabase.storage
                .from('exam_bucket')
                .getPublicUrl(audioFileName); // Corrected variable name

            if (error) {
                console.error('Error fetching audio file URL:', error);
                setAudioUrl(''); // Reset on error
                return;
            }

            if (audioPublicUrlData && audioPublicUrlData.publicUrl) {
                console.log('Audio file URL:', audioPublicUrlData.publicUrl);
                setAudioUrl(audioPublicUrlData.publicUrl);
            } else {
                console.error('Could not get public URL for audio file.');
                setAudioUrl(''); // Reset if URL is not available
            }
        } else {
            console.log('URL does not contain Chluas or Listening');
            setAudioUrl(''); // Reset if not applicable
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
        // Ensure URL state is set before using it
        if (!url) {
            console.error('URL state not ready for submit.');
            return;
        }
        // ... (keep existing handleSubmit logic, using the `url` state variable instead of window.location.href directly)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('User not authenticated. Please log in.');
            return;
        }

        const supabaseUserId = user.id;

        // Fetch user data
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

        // Use the 'url' state variable
        if (url.includes('examQuestion') || url.includes('markingScheme')) {
            console.log(`subject: ${subject}, level: ${level}, exam: ${exam}, paper: ${paper}, question: ${question}, year: ${year}`);

            // Only proceed if we have necessary details
            if (subject && exam && level) {
                console.log(`Fetching exam data for subject: ${subject}, exam: ${exam}, level: ${level}`);

                try {
                    const { data: examData, error: examDataError } = await supabase
                        .from('exams')
                        .select('id')
                        .eq('subject', subject)
                        .eq('exam', exam)
                        .single();

                    if (examDataError) {
                        console.log('Error fetching exam data:', examDataError);
                    }

                    if (!examData) {
                        throw new Error('Exam not found in the database. Please verify the input parameters.');
                    }

                    const examId = examData.id;

                    // Calculate the time spent on the page
                    const timeSpent = time - initialTime;

                    console.log(`userId: ${userId}, examId: ${examId}, timeSpent: ${timeSpent}`);

                    if (timeSpent > 0) {
                        const { data: examStudyData, error: examStudySelectError } = await supabase
                            .from('user_exam_study')
                            .select('time')
                            .eq('user_id', userId)
                            .eq('exam_id', examId)
                            .maybeSingle();

                        if (examStudySelectError) {
                            console.error('Error fetching user_exam_study data:', examStudySelectError);
                            throw new Error('Failed to fetch user exam study data.');
                        }

                        if (examStudyData) {
                            const newTimeSpent = examStudyData.time + timeSpent;
                            const { error: updateError } = await supabase
                                .from('user_exam_study')
                                .update({ time: newTimeSpent })
                                .eq('user_id', userId)
                                .eq('exam_id', examId);

                            if (updateError) {
                                console.error('Error updating user_exam_study:', updateError);
                                throw new Error('Failed to update user exam study time.');
                            }
                        } else {
                            const { error: insertError } = await supabase
                                .from('user_exam_study')
                                .insert({
                                    user_id: userId,
                                    exam_id: examId,
                                    time: timeSpent,
                                });

                            if (insertError) {
                                console.error('Error inserting into user_exam_study:', insertError);
                                throw new Error('Failed to insert user exam study time.');
                            }
                        }

                        console.log(`Recorded ${timeSpent} seconds for exam ID ${examId}`);
                    } else {
                        console.log('No time spent on this page, skipping time record.');
                    }
                } catch (error) {
                    console.error('Error processing exam study time:', error.message || error);
                    alert(error.message || 'An unexpected error occurred while processing exam study time.');
                }
            } else {
                console.warn("Missing subject, paper, or level for exam time tracking.");
            }
        }

        // --- Navigation Logic (keep as is, using the `url` state variable) ---
        if (url.includes('guidedStart')) {
            router.push(`/study/addFlashcards?overallTime=${time}&subject=${subject}&level=${level}`);
        } else if (url.includes('addFlashcards')) {
            if (url.includes('type=flashcard')) { // Check specifically for type=flashcard
                router.push(`/study/reviewFlashcards?overallTime=${time}&subject=${subject}&level=${level}&type=flashcard`);
            } else if (url.includes('paper')) {
                router.push(`/study/examRedirect?overallTime=${time}&subject=${subject}&level=${level}&exam=${exam}&paper=${paper}`);
            } else {
                router.push(`/study/reviewFlashcards?overallTime=${time}&subject=${subject}&level=${level}`);
            }
        } else if (url.includes('reviewFlashcards')) {
            if (time >= 1800 && time < 1830) { // Example: 30 minutes = 1800 seconds
                router.push(`/study/sessionCompleted?overallTime=${time}&subject=${subject}&level=${level}&exam=${exam}&paper=${paper}&question=${question}&year=${year}`);
            } else if (url.includes('type=flashcard')) { // Check for flashcard type again
                handleFinishStudying(); // Or specific action for finishing flashcard-only review
            } else {
                router.push(`/study/examRedirect?overallTime=${time}&subject=${subject}&level=${level}`);
            }
        } else if (url.includes('examPaperStart')) {
            router.push(`/study/examQuestion?overallTime=${time}&subject=${subject}&level=${level}&exam=${exam}&paper=${paper}&question=${question}&year=${year}`);
        } else if (url.includes('examQuestion')) {
            router.push(`/study/markingScheme?overallTime=${time}&subject=${subject}&level=${level}&exam=${exam}&paper=${paper}&question=${question}&year=${year}`);
        } else if (url.includes('markingScheme')) {
            if (question && subject && year && paper && level && userId) {
                try {
                    const { data: questionData, error: questionDataError } = await supabase
                        .from('questions')
                        .select('id')
                        .eq('subject', subject)
                        .eq('year', parseInt(year)) // Ensure year is integer if stored as number
                        .eq('paper', parseInt(paper)) // Ensure paper is integer if stored as number
                        .eq('higher_level', level === "higher")
                        .eq('question', question) // Assuming question is stored as text/varchar
                        .single();

                    if (questionDataError) throw questionDataError;
                    if (!questionData) throw new Error("Matching question not found in 'questions' table.");

                    const questionId = questionData.id;

                    console.log('Question ID:', questionId);
                    console.log('User ID:', userId);

                    const { data: questionDone, error: questionDoneSelectError } = await supabase
                        .from('questions_done')
                        .select('completed')
                        .eq('question_id', questionId)
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (questionDoneSelectError) {
                        console.error('Error fetching question_done:', questionDoneSelectError);
                        throw questionDoneSelectError;
                    }

                    if (questionDone) {
                        const newCompletedCount = questionDone.completed + 1;
                        const { error: updateError } = await supabase
                            .from('questions_done')
                            .update({ completed: newCompletedCount, last_completed: new Date().toISOString() })
                            .eq('question_id', questionId)
                            .eq('user_id', userId);

                        if (updateError) {
                            console.error('Error updating questions_done:', updateError);
                            throw updateError;
                        }
                        console.log(`Incremented completed count for question ID ${questionId}`);
                    } else {
                        console.log('Question ID:', questionId, 'not found in questions_done, creating new record.');
                        console.log('User ID:', userId);
                        const { error: insertError } = await supabase
                            .from('questions_done')
                            .insert({
                                question_id: questionId,
                                user_id: userId,
                                completed: 1,
                            });

                        if (insertError) {
                            console.error('Error inserting into questions_done:', insertError);
                            throw insertError;
                        }
                        console.log(`Created first completed record for question ID ${questionId}`);
                    }
                } catch (error) {
                    console.error('Error updating question completion status:', error);
                }
            } else {
                console.warn("Missing data required to mark question as completed.");
            }

            // Navigate after attempting completion update
            if (time >= 1800 && time < 1830) {
                router.push(`/study/sessionCompleted?overallTime=${time}&subject=${subject}&level=${level}&exam=${exam}&paper=${paper}&question=${question}&year=${year}`);
            } else {
                router.push(`/study/examRedirect?overallTime=${time}&subject=${subject}&level=${level}&exam=${exam}&paper=${paper}`);
            }
        } else if (url.includes('sessionCompleted')) {
            router.push(`/study/examRedirect?overallTime=${time}&subject=${subject}&level=${level}&exam=${exam}&paper=${paper}`);
        } else {
            console.log("Submit clicked on page without specific next step logic:", url);
        }
    };

    const handleFinishStudying = () => {
        setIsConfirmFinishOpen(true);
    };

    const confirmFinishStudying = async () => {
        setIsPaused(true);
        setIsConfirmFinishOpen(false);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.error('Error fetching user authentication:', userError);
                alert('Failed to authenticate user. Please log in again.');
                setIsPaused(false);
                return;
            }
            if (!user) {
                console.error('User not authenticated.');
                alert('User not authenticated. Please log in.');
                setIsPaused(false);
                return;
            }

            const supabaseUserId = user.id;

            // Fetch user data
            const { data: userData, error: userDataError } = await supabase
                .from('users')
                .select('id, study_time_today, streak, last_time_studied')
                .eq('supabase_user_id', supabaseUserId)
                .single();

            if (userDataError) {
                console.error('Error fetching user data:', userDataError);
                alert('Failed to fetch user data. Please try again later.');
                setIsPaused(false);
                return;
            }
            if (!userData) {
                console.error('User data not found.');
                alert('User data not found. Please contact support.');
                setIsPaused(false);
                return;
            }

            const userId = userData.id;

            // Validate `time`
            if (typeof time !== 'number' || time < 0) {
                console.error('Invalid study time detected:', time);
                alert('Invalid study time detected. Please refresh the page and try again.');
                setIsPaused(false);
                return;
            }
            if (time <= 0) {
                console.warn('Total session time is zero or negative, skipping study time update.');
                router.push('/dashboard');
                return;
            }

            const studyTimeMinutes = Math.max(0, Math.floor(time / 60));

            // Update user stats
            let newStudyTimeToday = (userData.study_time_today || 0) + studyTimeMinutes;
            let newStreak = userData.streak || 0;
            const lastTimeStudied = userData.last_time_studied ? new Date(userData.last_time_studied) : null;
            const now = new Date();
            const todayDateString = now.toDateString();

            if (lastTimeStudied) {
                const lastStudyDateString = lastTimeStudied.toDateString();
                if (lastStudyDateString !== todayDateString) {
                    const yesterday = new Date(now);
                    yesterday.setDate(now.getDate() - 1);
                    const yesterdayDateString = yesterday.toDateString();

                    if (lastStudyDateString === yesterdayDateString) {
                        newStreak += 1;
                    } else {
                        newStreak = 1;
                    }
                    newStudyTimeToday = studyTimeMinutes;
                } else {
                    if (newStreak === 0) newStreak = 1;
                }
            } else {
                newStreak = 1;
                newStudyTimeToday = studyTimeMinutes;
            }

            const { error: userUpdateError } = await supabase
                .from('users')
                .update({
                    study_time_today: newStudyTimeToday,
                    streak: newStreak,
                    last_time_studied: now.toISOString()
                })
                .eq('id', userId);

            if (userUpdateError) {
                console.error('Error updating user stats:', userUpdateError);
                alert('Failed to update user stats. Please try again later.');
                setIsPaused(false);
                return;
            }

            console.log('Updated user stats: study_time_today, streak, last_time_studied');

            // Update subject-specific time
            if (subject && studyTimeMinutes > 0) {
                const newTimeSpent = studyTimeMinutes;
                const newCalcTime = studyTimeMinutes;

                const { data: existingRecord, error: fetchError } = await supabase
                    .from('user_study_data')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('subject', subject)
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') {
                    console.error('Error fetching existing record:', fetchError);
                    return;
                }

                if (existingRecord) {
                    // Update the existing record
                    const { error: updateError } = await supabase
                        .from('user_study_data')
                        .update({
                            time_spent: existingRecord.time_spent + newTimeSpent,
                            calc_time: existingRecord.calc_time + newCalcTime,
                        })
                        .eq('user_id', userId)
                        .eq('subject', subject);

                    if (updateError) {
                        console.error('Error updating record:', updateError);
                    }
                } else {
                    // Insert a new record
                    const { error: insertError } = await supabase
                        .from('user_study_data')
                        .insert({
                            user_id: userId,
                            subject: subject,
                            time_spent: newTimeSpent,
                            calc_time: newCalcTime,
                        });

                    if (insertError) {
                        console.error('Error inserting record:', insertError);
                    }
                }
            } else {
                console.warn('Skipping subject time update: No subject specified or no time spent.');
            }

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Unexpected error during finish studying process:', error);
            alert(`An unexpected error occurred: ${error.message}. Please try again later.`);
            setIsPaused(false);
        }
    };

    // --- AI Handlers ---
    const handleOpenAiModal = () => {
        setAiError('');
        setIsAiModalOpen(true);
    };

    const handleCloseAiModal = () => {
        setIsAiModalOpen(false);
    };

    const handleAskAi = async (userPrompt) => {
        setIsAiLoading(true);
        setAiResponse('');
        setAiError('');

        // Prepare context
        const context = {
            subject: subject || null,
            level: level || null,
            year: year || null,
            paper: paper || null,
            question: question || null,
        };

        // Filter out null/empty values from context if needed by the API route
        const validContext = Object.entries(context).reduce((acc, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
        }, {});


        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: userPrompt,
                    context: Object.keys(validContext).length > 0 ? validContext : null // Send context only if available
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' })); // Try to parse error JSON
                console.error("API Error Response:", errorData);
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            setAiResponse(data.response);

        } catch (error) {
            console.error('Error fetching AI response:', error);
            setAiError(error.message || 'Failed to get response from AI');
        } finally {
            setIsAiLoading(false);
        }
    };
    // --- End AI Handlers ---


    return (
        // Add padding-bottom to the main container to avoid content being hidden by the fixed bottom bar
        <div className="min-h-screen flex flex-col justify-between pb-20 sm:pb-16"> {/* Adjusted padding */}

            {/* Main Content Area */}
            <div>
                {children}
            </div>

            {/* --- AI Trigger Button (Now on the left) --- */}
            {!audioUrl && ( // Only show AI button if audio player isn't present
                <button
                    type="button"
                    onClick={handleOpenAiModal}
                    className={`fixed left-0 top-1/2 transform -translate-y-1/2 z-30       // Stick out of the left side and center vertically
                    w-14 h-36 bg-gradient-to-br from-blue-600 to-green-400          // Size & Background
                    text-white shadow-lg                                               // Styling
                    hover:shadow-glow hover:scale-105                                  // Hover Effects
                    transition-all duration-300 ease-in-out                            // Animation
                    flex items-center justify-center                                   // Centering Icon/Text
                    group                                                              // Group for hover effects
                    ${isAiModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} // Hide button when panel is open
                    style={{
                        clipPath: 'polygon(0 0, 100% 10%, 100% 90%, 0% 100%)',             // Trapezium shape
                        transform: 'translateX(0%) translateY(-50%)',                    // Stick out of the side
                    }}
                    aria-label="Ask AI Helper"
                    title="Ask AI Helper"
                >
                    {/* Icon/Text inside the button */}
                    <div
                        className="relative z-10 group-hover:scale-[1.03] transition-transform duration-300 text-center leading-tight"
                        style={{
                            writingMode: 'vertical-rl', // Make text vertical
                            transform: 'rotate(180deg)', // Rotate text to read top-to-bottom
                        }}
                    >
                        <span className="text-lg font-semibold">625 AI</span> {/* Updated text */}
                    </div>
                </button>
            )}
            {/* --- End AI Trigger Button --- */}


            {/* --- AI Side Panel Component --- */}
            {/* Render the panel itself */}
            <AiHelperPanel
                isOpen={isAiModalOpen}
                onClose={handleCloseAiModal}
                onSubmit={handleAskAi}
                isLoading={isAiLoading}
                response={aiResponse}
                error={aiError}
                subjectContext={{ subject, level, year, paper, question }} // Pass context for display
            />
            {/* --- End AI Side Panel --- */}


            {/* --- Overlay for when panel is open --- */}
            {isAiModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40" // Lower z-index than panel
                    onClick={handleCloseAiModal} // Close panel when clicking overlay
                ></div>
            )}
            {/* --- End Overlay --- */}


            {/* --- Bottom Control Bar (Remains Fixed) --- */}
            <div className="bg-white text-black p-4 flex flex-col sm:flex-row justify-between items-center fixed bottom-0 w-full border-t border-gray-300 z-20"> {/* Keep z-index lower than button/panel */}
                {/* Left Section: Time and Controls */}
                <div className="flex items-center flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 mb-2 sm:mb-0 w-full sm:w-auto"> {/* Adjusted gaps */}
                    <span className="text-lg font-semibold whitespace-nowrap order-1 sm:order-none">
                        {formatTime(time)} {totalStudyTime > 0 ? `/ ${formatTime(totalStudyTime)}` : ''}
                    </span>
                    <button
                        type="button"
                        onClick={handlePauseResume}
                        className="px-3 py-1 bg-white text-black border border-black rounded hover:bg-gray-100 transition whitespace-nowrap min-w-[45px] h-[36px] flex items-center justify-center text-lg order-2 sm:order-none shadow" // Sized button
                        style={{ width: '45px' }}
                        aria-label={isPaused ? "Resume Timer" : "Pause Timer"}
                    >
                        {isPaused ? '▶' : '⏸'}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1 bg-white text-black border border-black rounded hover:bg-gray-100 transition whitespace-nowrap flex items-center justify-center text-sm order-3 sm:order-none shadow h-[36px]" // Sized button
                        aria-label={`Reset Timer to ${formatTime(initialTime)}`}
                    >
                        <span className="text-lg mr-1">↺</span> to {formatTime(initialTime)}
                    </button>
                </div>


                {/* Audio Player (conditionally rendered) - Center if no AI button or action buttons */}
                {audioUrl && (
                    <div className="bg-white rounded my-2 sm:my-0 order-last sm:order-none mx-auto sm:mx-4 flex-shrink-0">
                        <audio controls src={audioUrl} className="max-w-full h-10"> {/* Set explicit height */}
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}

                {/* Right Section: Action Buttons */}
                <div className="flex items-center flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto order-first sm:order-last">
                    {url.includes('markingScheme') && (
                        <button
                            type="button"
                            onClick={() => router.push(`/study/addFlashcards?overallTime=${time}&subject=${encodeURIComponent(subject)}&level=${level}&exam=${exam}&paper=${paper}&question=${question}&year=${year}`)} // Pass all relevant params
                            className="px-4 h-[36px] flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-700 transition whitespace-nowrap text-sm shadow"
                        >
                            Add Flashcard
                        </button>
                    )}
                    {/* Conditionally render Next button based on page type if needed */}
                    {!(url.includes('sessionCompleted') || (url.includes('reviewFlashcards') && url.includes('type=flashcard'))) && ( // Hide "Next" on completion/specific review end
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 h-[36px] flex items-center justify-center bg-green-500 text-white rounded hover:bg-green-700 transition whitespace-nowrap text-sm shadow"
                        >
                            Next
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleFinishStudying}
                        className="px-4 h-[36px] flex items-center justify-center bg-yellow-500 text-white rounded hover:bg-yellow-600 transition whitespace-nowrap text-sm shadow"
                    >
                        Finish Studying
                    </button>
                </div>
            </div>

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={isConfirmResetOpen}
                onClose={() => setIsConfirmResetOpen(false)}
                onConfirm={confirmReset}
                message={`Are you sure you want to reset the timer to ${formatTime(initialTime)}?`}
            />
            <ConfirmationModal
                isOpen={isConfirmFinishOpen}
                onClose={() => setIsConfirmFinishOpen(false)}
                onConfirm={confirmFinishStudying}
                message="Are you sure you want to finish studying?"
            />
        </div>
    );
};

export default StudyLayout;