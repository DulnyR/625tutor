"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';

const topics = {
    Algebra: [
        "Cubics",
        "Expressions & Factorising",
        "Inequalities",
        "Quadratics",
        "Simultaneous Equations",
        "Solving Equations"
    ],
    "Co-Ordinate Geometry": [
        "Geometry of the Circle",
        "Geometry of the Line"
    ],
    Differentiation: [
        "Applications",
        "Rules"
    ],
    Geometry: [
        "Geometry",
        "Constructions & Proofs"
    ],
    Statistics: [
        "Descriptive Statistics",
        "Inferential Statistics",
        "Z Scores"
    ],
    Trigonometry: [
        "Functions & Identities",
        "Triangles"
    ],
    Other: [
        "Area & Volume",
        "Complex Numbers",
        "Financial Maths",
        "Functions",
        "Indices and Logs",
        "Induction",
        "Integration",
        "Probability",
        "Sequences & Series"
    ]
};

const SelectMathsTopics = () => {
    const router = useRouter();
    const [selectedTopics, setSelectedTopics] = useState({});

    const handleCheckboxChange = (topic, subtopic) => {
        setSelectedTopics({
            ...selectedTopics,
            [subtopic]: !selectedTopics[subtopic]
        });
    };

    const handleSelectAll = () => {
        const allSelected = {};
        Object.keys(topics).forEach(topic => {
            topics[topic].forEach(subtopic => {
                allSelected[subtopic] = true;
            });
        });
        setSelectedTopics(allSelected);
    };

    const handleContinue = () => {
        console.log('Selected topics:', selectedTopics);
        router.push('/examQuestion'); 
    };

    return (
        <div className="p-6 bg-white min-h-screen text-black flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6">Which Maths topics have you covered so far?</h1>
            <div className="w-full max-w-2xl">
                {Object.keys(topics).map((topic) => (
                    <div key={topic} className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">{topic}</h2>
                        <div className="flex flex-wrap">
                            {topics[topic].map((subtopic) => (
                                <div key={subtopic} className="flex items-center mb-2 mr-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedTopics[subtopic] || false}
                                        onChange={() => handleCheckboxChange(topic, subtopic)}
                                        className="mr-2"
                                    />
                                    <label>{subtopic}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <div className="w-full">
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="flex items-center justify-center w-full px-4 py-2 mb-4 rounded bg-blue-500 text-white hover:bg-blue-700 transition"
                    >
                        Select All
                    </button>
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="flex items-center justify-center w-full px-4 py-2 rounded bg-green-500 text-white hover:bg-green-700 transition"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectMathsTopics;