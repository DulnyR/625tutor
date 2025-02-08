"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import '../globals.css';

const ExamQuestion = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialOverallTime = parseInt(searchParams.get('overallTime'), 10) || 0;

    const [isPaused, setIsPaused] = useState(false);
    const [time, setTime] = useState(0);
    const [overallTime, setOverallTime] = useState(initialOverallTime);

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

    const handleCompleteAttempt = () => {
        console.log('Attempt completed');
        router.push(`/markingScheme?time=${time}&overallTime=${overallTime}`);
    };

    return (
        <div className="p-6 bg-white min-h-screen text-black flex flex-col items-center">
            <div className="w-full max-w-6xl flex flex-col items-center">
                <h1 className="text-3xl font-bold mb-6">Exam Question</h1>
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
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 transition"
                        >
                            Complete Attempt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamQuestion;