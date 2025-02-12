"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import '../globals.css';

const StudyLayout = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isPaused, setIsPaused] = useState(false);
    const [time, setTime] = useState(0);
    const [initialTime, setInitialTime] = useState(0);
    const [selectedPoints, setSelectedPoints] = useState(0);
    const [totalStudyTime, setTotalStudyTime] = useState(0);

    useEffect(() => {
        let timer;
        if (!isPaused) {
            timer = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPaused]);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const overallTime = parseInt(searchParams.get('overallTime'), 10) || 0;
        setTime(overallTime);
        setInitialTime(overallTime);
        fetchTotalStudyTime();
    }, [pathname]);

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

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}`;
    };

    const handlePauseResume = () => {
        setIsPaused(!isPaused);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset the timer?')) {
            setTime(initialTime);
            setIsPaused(false);
        }
    };

    const handleSubmit = async () => {
        if (selectedPoints !== null) {
            console.log(`Selected points: ${selectedPoints}`);
            router.push(`/examQuestion?overallTime=${time}`);
        } else {
            alert('Please select a point value.');
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
                .eq('subject', 'Mathematics') // Replace 'Mathematics' with the actual subject
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
                .eq('subject', 'Mathematics'); // Replace 'Mathematics' with the actual subject

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
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition whitespace-nowrap min-w-[100px]"
                    >
                        {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition whitespace-nowrap min-w-[100px]"
                    >
                        🔄 Reset
                    </button>
                </div>

                {/* Right Section: Submit and Finish Studying Buttons */}
                <div className="flex items-center flex-nowrap flex-shrink-0 space-x-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-green text-white rounded hover:bg-green-700 transition whitespace-nowrap min-w-[100px]"
                    >
                        Next
                    </button>
                    <button
                        type="button"
                        onClick={handleFinishStudying}
                        className="px-4 py-2 bg-yellow text-white rounded hover:bg-yellow-700 transition whitespace-nowrap min-w-[100px]"
                    >
                        Finish Studying
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudyLayout;