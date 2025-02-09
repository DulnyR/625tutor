"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import ProgressBar from '../../components/progressBar';
import '../globals.css';

const ExamQuestion = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialOverallTime = parseInt(searchParams.get('overallTime'), 10) || 0;

    const [isPaused, setIsPaused] = useState(false);
    const [time, setTime] = useState(0);
    const [overallTime, setOverallTime] = useState(initialOverallTime);
    const subject = "Mathematics";

    useEffect(() => {
        let timer;
        if (!isPaused) {
            timer = setInterval(() => {
                setTime(prevTime => prevTime + 1);
                setOverallTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPaused]);

    const handlePauseResume = () => {
        setIsPaused(!isPaused);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset the timer?')) {
            setTime(0);
            setIsPaused(false);
        }
    };

    const handleCompleteAttempt = async () => {
        console.log('Attempt completed');
        await updateTotalTime();
        router.push(`/markingScheme?time=${time}&overallTime=${overallTime}`);
    };

    const handleFinishStudying = async () => {
        if (window.confirm('Are you sure you want to finish studying? You will lose your progress on the current question.')) {
            await updateTotalTime();
            await updateStudyData();
            router.push('/dashboard');
        }
    };

    const updateTotalTime = async () => {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('User not authenticated. Please log in.');
            return;
        }

        const supabaseUserId = user.id;

        const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('id, total_time')
            .eq('supabase_user_id', supabaseUserId)
            .single();

        if (userDataError) {
            console.error('Error fetching user data:', userDataError);
            return;
        }

        const userId = userData.id;
        const additionalTime = Math.floor(overallTime / 60); // Convert overall time to minutes

        const { error } = await supabase
            .from('users')
            .update({ total_time: userData.total_time + additionalTime })
            .eq('id', userId);

        if (error) {
            console.error('Error updating total time:', error);
            return;
        }
    };

    const updateStudyData = async () => {
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
        const additionalTime = Math.floor(overallTime / 60); // Convert overall time to minutes

        const { data: studyData, error: studyDataError } = await supabase
            .from('user_study_data')
            .select('time_spent')
            .eq('user_id', userId)
            .eq('subject', subject)
            .single();

        if (studyDataError) {
            console.error('Error fetching study data:', studyDataError);
            return;
        }

        const { error } = await supabase
            .from('user_study_data')
            .update({ time_spent: studyData.time_spent + additionalTime })
            .eq('user_id', userId)
            .eq('subject', subject);

        if (error) {
            console.error('Error updating study data:', error);
            return;
        }
    };

    return (
        <div className="bg-white min-h-screen text-black flex flex-col items-center">
            <ProgressBar currentTime={overallTime} subject={subject} />
            <div className="w-full max-w-6xl flex flex-col items-center">
                <h1 className="text-3xl font-bold mb-6" style={{ paddingTop: '3rem' }}>Exam Question</h1>
                <div className="w-full flex">
                    <div className="w-4/5">
                        <img src="/sample_exam_question.png" alt="Sample Exam Question" className="w-full h-auto" />
                    </div>
                    <div className="w-1/5 flex flex-col items-center">
                        <div className="mb-4">
                            <span className="text-xl font-semibold">Overall Time: {Math.floor(overallTime / 60)}:{overallTime % 60 < 10 ? `0${overallTime % 60}` : overallTime % 60}</span>
                        </div>
                        <div className="mb-4">
                            <span className="text-xl font-semibold">Question Time: {Math.floor(time / 60)}:{time % 60 < 10 ? `0${time % 60}` : time % 60}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={handlePauseResume}
                                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
                            >
                                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition"
                            >
                                🔄 Reset
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleCompleteAttempt}
                            className="px-4 py-2 bg-green text-white rounded hover:bg-green-700 transition"
                        >
                            Complete Attempt
                        </button>
                        <button
                            type="button"
                            onClick={handleFinishStudying}
                            className="mt-4 px-4 py-2 bg-yellow text-white rounded hover:bg-yellow transition"
                        >
                            Finish Studying
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamQuestion;