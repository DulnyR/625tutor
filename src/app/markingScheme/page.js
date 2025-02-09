"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import ProgressBar from '../../components/progressBar';
import '../globals.css';

const MarkingScheme = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialOverallTime = parseInt(searchParams.get('overallTime'), 10) || 0;
    const [overallTime, setOverallTime] = useState(initialOverallTime);
    const [markingTime, setMarkingTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedPoints, setSelectedPoints] = useState(0);
    const availablePoints = [0, 2, 3, 4, 5];
    const subject = "Mathematics"; // Example subject

    useEffect(() => {
        let timer;
        if (!isPaused) {
            timer = setInterval(() => {
                setMarkingTime(prevTime => prevTime + 1);
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
            setMarkingTime(0);
            setOverallTime(initialOverallTime);
            setIsPaused(false);
        }
    };

    const handleSliderChange = (event) => {
        const value = Number(event.target.value);
        const closestValue = availablePoints.reduce((prev, curr) => Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
        setSelectedPoints(closestValue);
    };

    const handleSubmit = async () => {
        if (selectedPoints !== null) {
            console.log(`Selected points: ${selectedPoints}`);
            await updateTotalTime();
            await updateStudyData();
            router.push(`/examQuestion?overallTime=${overallTime}`);
        } else {
            alert('Please select a point value.');
        }
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
            <h1 className="text-3xl font-bold mb-6" style={{ paddingTop: '3rem' }}>Marking Scheme</h1>
            <div className="w-full max-w-6xl flex">
                <div className="w-4/5">
                    <img src="/sample_marking_scheme.png" alt="Sample Marking Scheme" className="w-full h-auto" />
                </div>
                <div className="w-1/5 flex flex-col items-center">
                    <div className="mb-4">
                        <span className="text-xl font-semibold">Overall Time: {Math.floor(overallTime / 60)}:{overallTime % 60 < 10 ? `0${overallTime % 60}` : overallTime % 60}</span>
                    </div>
                    <div className="mb-4">
                        <span className="text-xl font-semibold">Marking Time: {Math.floor(markingTime / 60)}:{markingTime % 60 < 10 ? `0${markingTime % 60}` : markingTime % 60}</span>
                    </div>
                    <div className="flex flex-col items-center mb-4">
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
                    <div className="mb-4">
                        <span className="text-xl font-semibold">How did you do?</span>
                    </div>
                    <div className="flex flex-col items-center mb-4">
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="1"
                            value={selectedPoints}
                            onChange={handleSliderChange}
                            className="w-full"
                            list="tickmarks"
                        />
                        <datalist id="tickmarks">
                            {availablePoints.map(point => (
                                <option key={point} value={point} />
                            ))}
                        </datalist>
                        <span className="mt-2 text-xl">{selectedPoints} Marks</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-green text-white rounded hover:bg-green-700 transition"
                    >
                        Submit
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
    );
};

export default MarkingScheme;