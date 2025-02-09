"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import '../globals.css';

const ReviewFlashcards = () => {
    const router = useRouter();
    const [flashcards, setFlashcards] = useState([]);
    const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => {
        fetchDueFlashcards();
    }, []);

    const fetchDueFlashcards = async () => {
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

        const { data: dueFlashcards, error: flashcardsError } = await supabase
            .from('flashcards')
            .select('*')
            .eq('user_id', userId)
            .lte('next_review', new Date().toISOString())
            .order('next_review', { ascending: true });

        if (flashcardsError) {
            console.error('Error fetching due flashcards:', flashcardsError);
            return;
        }

        setFlashcards(dueFlashcards);
    };

    const handleShowAnswer = () => {
        setShowAnswer(true);
    };

    const handleRating = async (rating) => {
        const flashcard = flashcards[currentFlashcardIndex];
        const { ease_factor, repetitions, interval } = updateFlashcard(flashcard, rating);

        const { error } = await supabase
            .from('flashcards')
            .update({
                ease_factor,
                repetitions,
                interval,
                last_reviewed: new Date().toISOString(),
                next_review: new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', flashcard.id);

        if (error) {
            console.error('Error updating flashcard:', error);
            return;
        }

        setShowAnswer(false);
        setCurrentFlashcardIndex((prevIndex) => (prevIndex + 1));
    };

    const updateFlashcard = (flashcard, rating) => {
        let { ease_factor, repetitions, interval } = flashcard;

        if (rating >= 3) {
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * ease_factor);
            }
            repetitions += 1;
        } else {
            repetitions = 0;
            interval = 1;
        }

        ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));

        return { ease_factor, repetitions, interval };
    };

    if (flashcards.length === 0) {
        return <div className="flex min-h-screen bg-gray text-black justify-center items-center">No flashcards due for review.</div>;
    }

    const currentFlashcard = flashcards[currentFlashcardIndex];

    if (!currentFlashcard) {
        return <div className="flex min-h-screen bg-gray text-black justify-center items-center">All flashcards reviewed.</div>;
    }

    const ratingColors = {
        0: "bg-red-500", // Again
        1: "bg-orange-500", // Hard
        3: "bg-blue-500", // Good
        4: "bg-green", // Easy
        5: "bg-teal-500", // Very Easy
    };

    return (
        <div className="flex min-h-screen bg-gray text-black justify-center items-center">
            <div className="bg-white p-6 shadow-lg rounded-lg w-1/2">
                <h2 className="text-2xl font-bold mb-6 text-black">Review Flashcards</h2>
                <div className="mb-4">
                    <strong>Subject:</strong> {currentFlashcard.subject}
                </div>
                <div className="mb-4">
                    <strong>Q:</strong> {currentFlashcard.front}
                </div>
                {showAnswer && (
                    <div className="mb-4">
                        <strong>A:</strong> {currentFlashcard.back}
                    </div>
                )}
                {!showAnswer ? (
                    <button
                        onClick={handleShowAnswer}
                        className="bg-blue-500 text-white p-2 rounded mb-4"
                    >
                        Show Answer
                    </button>
                ) : (
                    <div className="flex space-x-2">
                        {[
                            { label: 'Again', value: 0 },
                            { label: 'Hard', value: 1 },
                            { label: 'Good', value: 3 },
                            { label: 'Easy', value: 4 },
                            { label: 'Very Easy', value: 5 },
                        ].map((rating) => (
                            <button
                                key={rating.value}
                                onClick={() => handleRating(rating.value)}
                                className={`${ratingColors[rating.value]} text-white p-2 rounded`}
                            >
                                {rating.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewFlashcards;