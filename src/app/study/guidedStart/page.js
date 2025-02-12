"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import '../../globals.css';

const GuidedStartPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const subject = searchParams.get('subject');

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center px-8 " style={{ marginTop: '-70px' }}>
            <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6 ml-4">
                {/* Header */}
                <h1 className="text-4xl font-bold text-center text-black mb-4">
                    625Tutor's Guided Study for <span className="text-blue-600">{subject}</span>
                </h1>

                {/* Introduction Paragraph */}
                <p className="text-lg text-black leading-relaxed">
                    To get the most out of 625Tutor's Guided Study, make sure to focus on the task at hand. Pause the timer in the bottom left-hand corner of the page if you need a quick break. Don't worry if you forget—the reset button will take you back to the time you started the current task! We recommend studying in 30-minute sessions, so feel free to take a longer break when your timer passes the goal. If you stick to this method most days, your results will be better than ever.
                </p>

                {/* Flashcard Instructions */}
                <p className="text-lg text-black leading-relaxed">
                    Our first step will be making some flashcards. Use these for things you need to memorize rather than understand. For example: <span className="italic">"What do the angles in a triangle add up to?"</span> → <span className="italic">"180 degrees."</span> Don't worry about adding many of them now, just what you learned recently. Whenever you're ready, press <span className="font-semibold">Next</span> to get started!
                </p>
            </div>
        </div>
    );
};

export default GuidedStartPage;