"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import '../globals.css';

const MarkingScheme = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialOverallTime = parseInt(searchParams.get('overallTime'), 10);
    const [overallTime, setOverallTime] = useState(initialOverallTime);
    const [markingTime, setMarkingTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedPoints, setSelectedPoints] = useState(0);
    const availablePoints = [0, 2, 3, 4, 5];

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

    const handleSubmit = () => {
        if (selectedPoints !== null) {
            console.log(`Selected points: ${selectedPoints}`);
            router.push(`/examQuestion?overallTime=${overallTime}`); 
        } else {
            alert('Please select a point value.');
        }
    };

    return (
        <div className="p-6 bg-white min-h-screen text-black flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6">Marking Scheme</h1>
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
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 transition"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MarkingScheme;