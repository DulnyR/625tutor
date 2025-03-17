"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import '../globals.css';

const StudyLayout = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isPaused, setIsPaused] = useState(false);
    const [time, setTime] = useState(0);
    const [initialTime, setInitialTime] = useState(0);
    const [totalStudyTime, setTotalStudyTime] = useState(0);
    const [subject, setSubject] = useState('');
    const [paper, setPaper] = useState('');
    const [question, setQuestion] = useState('');
    const [year, setYear] = useState('');
    const [level, setLevel] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const searchParams = useSearchParams();
    const url = window.location.href;

    useEffect(() => {
        const overallTime = parseInt(searchParams.get('overallTime'), 10) || 0;
        setTime(overallTime);
        setInitialTime(overallTime);
        setSubject(searchParams.get('subject') || '');
        setLevel(searchParams.get('level') || '');
        setPaper(searchParams.get('paper') || '');
        setQuestion(searchParams.get('question') || '');
        setYear(searchParams.get('year') || '');
    }, [pathname]);

    useEffect(() => {
        fetchTotalStudyTime();
        fetchAudioFile();
    }, [subject]);

    useEffect(() => {
        let timer;
        if (!isPaused) {
            timer = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPaused]);

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

        setTotalStudyTime(userData.study_time * 60);
    };

    const fetchAudioFile = async () => {
        console.log('Fetching audio file...');
        console.log('Current URL:', url);
        if (url.includes('Chluas') || url.includes('Listening')) {
            console.log('URL contains Chluas or Listening');
            const audioFileName = `${subject}_${year}_0_${level === "higher" ? 'Higher' : 'Ordinary'}.mp3`;
            console.log('Audio file name:', audioFileName);
            const { data: audioPublicUrl, error } = supabase.storage
                .from('exam_bucket') 
                .getPublicUrl(audioFileName);

            if (error) {
                console.error('Error fetching audio file URL:', error);
                return;
            }

            console.log('Audio file URL:', audioPublicUrl.publicUrl);
            setAudioUrl(audioPublicUrl.publicUrl);
        } else {
            console.log('URL does not contain Chluas or Listening');
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
        if (window.confirm(`Are you sure you want to reset the timer to ${formatTime(initialTime)}?`)) {
            setTime(initialTime);
            setIsPaused(false);
        }
    };

    const handleSubmit = async () => {
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

        if (url.includes('examQuestion') || url.includes('markingScheme')) {
            console.log(`subject: ${subject}, level: ${level}, paper: ${paper}, question: ${question}, year: ${year}`);
            // Fetch exam_id from the exams table
            let exam;
            if (!isNaN(paper)) {
                exam = `Paper ${paper}`;
            } else {
                exam = paper;
            }
            const { data: examData, error: examDataError } = await supabase
                .from('exams')
                .select('id')
                .eq('subject', subject)
                .eq('exam', exam) // Paper is stored as "Paper 1", "Paper 2", etc.
                .single();

            if (examDataError) {
                console.error('Error fetching exam data:', examDataError);
                return;
            }

            const examId = examData.id;

            // Calculate the time spent on the page
            const timeSpent = time - initialTime;

            // Insert or update the time spent in the user_exam_study table
            const { data: examStudyData, error: examStudyDataError } = await supabase
                .from('user_exam_study')
                .select('time')
                .eq('user_id', userId)
                .eq('exam_id', examId)
                .single();

            if (examStudyDataError) {
                // If the row does not exist, create one with the current time
                const { error: insertError } = await supabase
                    .from('user_exam_study')
                    .insert({
                        user_id: userId,
                        exam_id: examId,
                        time: timeSpent
                    });

                if (insertError) {
                    console.error('Error inserting exam study data:', insertError);
                    return;
                }
            } else {
                // If the row exists, update the time spent
                const newTimeSpent = examStudyData.time + timeSpent;
                const { error: updateError } = await supabase
                    .from('user_exam_study')
                    .update({ time: newTimeSpent })
                    .eq('user_id', userId)
                    .eq('exam_id', examId);

                if (updateError) {
                    console.error('Error updating exam study data:', updateError);
                    return;
                }
            }
        }

        if (url.includes('guidedStart')) {
            router.push(`/study/addFlashcards?overallTime=${time}&subject=${subject}&level=${level}`);
        } else if (url.includes('addFlashcards')) {
            if (url.includes('type')) {
                router.push(`/study/reviewFlashcards?overallTime=${time}&subject=${subject}&level=${level}&type=flashcard`);
            } else {
                router.push(`/study/reviewFlashcards?overallTime=${time}&subject=${subject}&level=${level}`);
            }
        } else if (url.includes('reviewFlashcards')) {
            if (time >= 1800 && time < 1830) {
                router.push(`/study/sessionCompleted?overallTime=${time}&subject=${subject}&level=${level}&paper=${paper}&question=${question}&year=${year}`);
            } else if (url.includes('type')) {
                handleFinishStudying();
            } else {
                router.push(`/study/examRedirect?overallTime=${time}&subject=${subject}&level=${level}`);
            }
        } else if (url.includes('examPaperStart')) {
            router.push(`/study/examQuestion?overallTime=${time}&subject=${subject}&level=${level}&paper=${paper}&question=${question}&year=${year}`);
        } else if (url.includes('examQuestion')) {
            router.push(`/study/markingScheme?overallTime=${time}&subject=${subject}&level=${level}&paper=${paper}&question=${question}&year=${year}`);
        } else if (url.includes('markingScheme')) {
            if (question) {
                // Increment the "completed" column in the "questions_done" table
                const { data: questionData, error: questionDataError } = await supabase
                    .from('questions')
                    .select('id')
                    .eq('subject', subject)
                    .eq('year', year)
                    .eq('paper', Number(paper))
                    .eq('higher_level', level === "higher")
                    .eq('question', question)
                    .single();

                if (questionDataError) {
                    console.error('Error fetching question data:', questionDataError);
                    return;
                }

                const questionId = questionData.id;

                const { data: questionDone, error: questionDoneError } = await supabase
                    .from('questions_done')
                    .select('completed')
                    .eq('question_id', questionId)
                    .eq('user_id', userId)
                    .single();

                if (questionDoneError) {
                    const { error: insertError } = await supabase
                        .from('questions_done')
                        .insert({
                            question_id: questionId,
                            user_id: userId,
                            completed: 1
                        });

                    if (insertError) {
                        console.error('Error inserting question done:', insertError);
                        return;
                    }
                } else {
                    const newCompletedCount = questionDone.completed + 1;
                    const { error: updateError } = await supabase
                        .from('questions_done')
                        .update({ completed: newCompletedCount })
                        .eq('question_id', questionId)
                        .eq('user_id', userId);

                    if (updateError) {
                        console.error('Error updating question done:', updateError);
                        return;
                    }
                }
            }

            if (time >= 1800 && time < 1830) {
                router.push(`/study/sessionCompleted?overallTime=${time}&subject=${subject}&level=${level}&paper=${paper}&question=${question}&year=${year}`);
            } else {
                router.push(`/study/examRedirect?overallTime=${time}&subject=${subject}&level=${level}&paper=${paper}`);
            }
        } else if (url.includes('sessionCompleted')) {
            router.push(`/study/examRedirect?overallTime=${time}&subject=${subject}&level=${level}&paper=${paper}`);
        }
    };

    const handleFinishStudying = async () => {
        if (window.confirm('Are you sure you want to finish studying?')) {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.error('User not authenticated. Please log in.');
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
                return;
            }

            const userId = userData.id;

            // Ensure `time` is defined and valid
            if (typeof time !== 'number' || time <= 0) {
                console.error('Invalid study time.');
                return;
            }

            // Convert time to minutes
            const studyTimeMinutes = Math.floor(time / 60);
            const newStudyTimeToday = userData.study_time_today + studyTimeMinutes;

            // Streak logic
            let newStreak = userData.streak;
            const lastTimeStudied = new Date(userData.last_time_studied);
            const now = new Date();

            // Check if the last study session was yesterday
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);

            const isSameDay = lastTimeStudied.toDateString() === now.toDateString();
            const isYesterday = lastTimeStudied.toDateString() === yesterday.toDateString();

            if (isSameDay) {
                // Do nothing; streak remains the same
                if (newStreak === 0) {
                    newStreak = 1;
                }
            } else if (isYesterday) {
                // Increment streak if the last study session was yesterday
                newStreak += 1;
            } else {
                // Reset streak if the last study session was not yesterday
                newStreak = 0;
            }

            // Update user data in the database
            const { error: userUpdateError } = await supabase
                .from('users')
                .update({
                    study_time_today: newStudyTimeToday,
                    streak: newStreak,
                    last_time_studied: now.toISOString()
                })
                .eq('id', userId);

            if (userUpdateError) {
                console.error('Error updating user data:', userUpdateError);
                return;
            }

            // Fetch current time_spent for the subject
            const { data: studyData, error: studyDataFetchError } = await supabase
                .from('user_study_data')
                .select('time_spent')
                .eq('user_id', userId)
                .eq('subject', subject)
                .single();

            if (studyDataFetchError) {
                console.error('Error fetching study data:', studyDataFetchError);
                return;
            }

            const newTimeSpent = studyData.time_spent + studyTimeMinutes;

            // Update time_spent in user_study_data table
            const { error: studyDataUpdateError } = await supabase
                .from('user_study_data')
                .update({
                    time_spent: newTimeSpent
                })
                .eq('user_id', userId)
                .eq('subject', subject);

            if (studyDataUpdateError) {
                console.error('Error updating study data:', studyDataUpdateError);
                return;
            }

            // Redirect to dashboard
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between">
            <div>
                {children}
            </div>
            <div className="bg-white text-black p-4 flex justify-between items-center fixed bottom-0 w-full border-t border-gray-300 overflow-x-auto">
                {/* Left Section: Time and Buttons */}
                <div className="flex items-center flex-nowrap flex-shrink-0 space-x-4">
                    <span className="text-xl font-semibold whitespace-nowrap">
                        {formatTime(time)} / {formatTime(totalStudyTime)}
                    </span>
                    <button
                        type="button"
                        onClick={handlePauseResume}
                        className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-100 transition whitespace-nowrap min-w-[50px] flex items-center justify-center"
                    >
                        {isPaused ? (
                            <span className="text-lg">▶</span> // Play symbol
                        ) : (
                            <span className="text-lg">⏸</span> // Pause symbol
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-100 transition whitespace-nowrap min-w-[50px] flex items-center justify-center"
                    >
                        <span className="text-lg">↺ to {formatTime(initialTime)}</span> {/* Reset symbol with initial time */}
                    </button>
                </div>

                {audioUrl && (
                <div className="bg-white rounded ">
                    <audio controls>
                        <source src={audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio>
                </div>
                )}

                {/* Right Section: Submit and Finish Studying Buttons */}
                <div className="flex items-center flex-nowrap flex-shrink-0 space-x-4">
                    {url.includes('markingScheme') && (
                        <button
                            type="button"
                            onClick={() => router.push(`/study/addFlashcards?overallTime=${time}&subject=${subject}&level=${level}&paper=${paper}`)}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition whitespace-nowrap min-w-[100px]"
                        >
                            Add Flashcard
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 transition whitespace-nowrap min-w-[100px]"
                    >
                        Next
                    </button>
                    <button
                        type="button"
                        onClick={handleFinishStudying}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-700 transition whitespace-nowrap min-w-[100px]"
                    >
                        Finish Studying
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudyLayout;