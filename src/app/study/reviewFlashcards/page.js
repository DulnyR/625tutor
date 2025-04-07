"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import LoadingScreen from '../loadingScreen';

const ReviewFlashcards = () => {
    const searchParams = useSearchParams();
    let subject = searchParams.get('subject');
    const [flashcards, setFlashcards] = useState([]);
    const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);

    if (subject && subject.includes('Design')) {
        subject = 'Design & Communication Graphics';
    }

    useEffect(() => {
        fetchDueFlashcards();
    }, [subject]);

    const fetchDueFlashcards = async () => {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('User not authenticated. Please log in.');
            setLoading(false);
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
            setLoading(false);
            return;
        }

        const userId = userData.id;

        const { data: dueFlashcards, error: flashcardsError } = await supabase
            .from('flashcards')
            .select('*')
            .eq('user_id', userId)
            .eq('subject', subject)
            .lte('next_review', new Date().toISOString())
            .order('next_review', { ascending: true });

        if (flashcardsError) {
            console.error('Error fetching due flashcards:', flashcardsError);
            setLoading(false);
            return;
        }

        setFlashcards(dueFlashcards);
        setLoading(false);
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

    const handleRemoveFlashcard = async (flashcardId) => {
        const { error } = await supabase
            .from('flashcards')
            .delete()
            .eq('id', flashcardId);

        if (error) {
            console.error('Error removing flashcard:', error);
            return;
        }

        setFlashcards(flashcards.filter((flashcard) => flashcard.id !== flashcardId));
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

    if (loading) {
        return <LoadingScreen />;
    }

    if (flashcards.length === 0) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 text-black justify-center items-center">
                <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-md text-center">
                    <p className="text-2xl mb-4">No flashcards due for review.</p>
                    <p className="text-lg">Click <strong>Next</strong> to continue.</p>
                </div>
            </div>
        );
    }

    const currentFlashcard = flashcards[currentFlashcardIndex];

    if (!currentFlashcard) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 text-black justify-center items-center">
                <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-md text-center">
                    <p className="text-2xl mb-4">All flashcards reviewed.</p>
                    <p className="text-lg">Click <strong>Next</strong> to continue.</p>
                </div>
            </div>
        );
    }

    const ratingColors = {
        0: "bg-red-500", // Again
        1: "bg-orange-500", // Hard
        3: "bg-blue-500", // Good
        4: "bg-green-500", // Easy
        5: "bg-teal-500", // Very Easy
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 text-black justify-center items-center">
            <div className="w-full max-w-4xl px-4">
                <div className="flashcard-stack">
                    {flashcards.slice(currentFlashcardIndex).map((flashcard, index) => (
                        <div
                            key={flashcard.id}
                            className={`flashcard ${index === 0 ? 'current' : ''}`}
                            style={{ zIndex: flashcards.length - index }}
                        >
                            <div className="bg-white p-6 shadow-lg rounded-lg w-full text-center relative h-[350px] flex flex-col">
                                {/* Delete button at the top-right */}
                                <button
                                    onClick={() => handleRemoveFlashcard(flashcard.id)}
                                    className="absolute top-2 right-2 text-red-500 mt-2 mr-2                                    npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome hover:text-red-700 text-lg"
                                >
                                    Remove
                                </button>

                                {/* Flashcard content (scrollable) */}
                                <div className="flex-1 overflow-y-auto mt-4 mb-4">
                                    <div className="text-2xl">
                                        <strong>{flashcard.front}</strong>
                                    </div>
                                    {showAnswer && index === 0 && (
                                        <div className="text-2xl mt-4">
                                            {flashcard.back}
                                        </div>
                                    )}
                                </div>

                                {/* Buttons at the bottom */}
                                <div className="mt-auto">
                                    {!showAnswer && index === 0 ? (
                                        <button
                                            onClick={handleShowAnswer}
                                            className="bg-blue-500 text-white p-2 rounded w-full"
                                        >
                                            Show Answer
                                        </button>
                                    ) : (
                                        index === 0 && (
                                            <div className="flex justify-center space-x-2">
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
                                                        className={`${ratingColors[rating.value]} text-white p-2 rounded flex-1`}
                                                    >
                                                        {rating.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewFlashcards;