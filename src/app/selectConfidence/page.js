"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import '../globals.css';

const SelectConfidence = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const subjectsQuery = searchParams.get('subjects');
    const levelsQuery = searchParams.get('levels');

    const [subjects, setSubjects] = useState([]);
    const [confidenceLevels, setConfidenceLevels] = useState({});

    useEffect(() => {
        if (subjectsQuery && levelsQuery) {
            const subjectsArray = subjectsQuery.split(',');
            const levelsArray = levelsQuery.split(',');
            const subjectsData = subjectsArray.map((subject, index) => ({
                name: subject,
                level: levelsArray[index],
            }));
            setSubjects(subjectsData);

            const initialConfidenceLevels = subjectsArray.reduce((acc, subject) => {
                acc[subject] = 5; // Default confidence level
                return acc;
            }, {});
            setConfidenceLevels(initialConfidenceLevels);
        }
    }, [subjectsQuery, levelsQuery]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSliderChange = (subjectName, value) => {
        setConfidenceLevels({
            ...confidenceLevels,
            [subjectName]: value,
        });
    };

    const allConfidenceLevelsSet = subjects.every(subject => confidenceLevels[subject.name] !== undefined);

    const handleContinue = () => {
        if (allConfidenceLevelsSet) {
            console.log('Continue with:', confidenceLevels);
            router.push('/selectMathsTopics');
        }
    };

    return (
        <div className="p-6 bg-white min-h-screen text-black flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6">How Confident Are You In These Subjects?</h1>
            <div className="w-full max-w-2xl">
                {subjects.map((subject) => (
                    <div key={subject.name} className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">{subject.name} ({subject.level})</h2>
                        <div className="flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={confidenceLevels[subject.name] || 5}
                                onChange={(e) => handleSliderChange(subject.name, e.target.value)}
                                className="w-full"
                            />
                            <span className="ml-4">{confidenceLevels[subject.name]}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                            <span>No Confidence</span>
                            <span>Extremely Confident</span>
                        </div>
                    </div>
                ))}
                <div className="w-full">
                    <button
                        type="button"
                        onClick={handleContinue}
                        className={`flex items-center justify-center w-full px-4 py-2 rounded transition ${allConfidenceLevelsSet ? 'bg-green-500 text-white hover:bg-green-700' : 'bg-gray cursor-not-allowed'}`}
                        disabled={!allConfidenceLevelsSet}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectConfidence;