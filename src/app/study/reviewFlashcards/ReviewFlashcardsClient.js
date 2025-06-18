"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient'; // Ensure this path is correct
import LoadingScreen from '../loadingScreen'; // Ensure this path is correct

const ReviewFlashcardsClient = () => {
    const searchParams = useSearchParams();
    let subjectParam = searchParams.get('subject'); // Renamed to avoid conflict with state/variable `subject`
    const [flashcards, setFlashcards] = useState([]);
    const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subject, setSubject] = useState(''); // Use state for subject if it's derived and used in effects

    // Prevent scrolling on mount, restore on unmount
    useEffect(() => {
        // Disable scrolling
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        return () => {
            // Re-enable scrolling when component unmounts
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        let currentSubject = subjectParam;
        if (currentSubject && currentSubject.includes('Design')) {
            currentSubject = 'Design & Communication Graphics';
        }
        setSubject(currentSubject || ''); // Set the processed subject to state
    }, [subjectParam]);


    // Helper function for spaced repetition logic (can be outside component if it doesn't need component scope)
    const updateFlashcardSRSData = (flashcard, rating) => {
        let { ease_factor, repetitions, interval } = flashcard;

        // Ensure ease_factor is a number and has a sensible default
        ease_factor = Number(ease_factor) || 2.5;
        repetitions = Number(repetitions) || 0;
        interval = Number(interval) || 0;


        if (rating >= 3) { // Correct recall
            if (repetitions === 0) {
                interval = 1;
            } else if (repetitions === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * ease_factor);
            }
            repetitions += 1;
        } else { // Incorrect recall
            repetitions = 0; // Reset repetitions
            interval = 1;    // Next review in 1 day
        }

        // Adjust ease factor
        ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
        if (ease_factor < 1.3) {
            ease_factor = 1.3; // Minimum ease factor
        }

        return { ease_factor, repetitions, interval };
    };


    const handleRating = useCallback(async (rating) => {
        if (flashcards.length === 0 || !flashcards[currentFlashcardIndex]) {
            console.warn("handleRating called with no flashcards or invalid index");
            return;
        }
        const flashcard = flashcards[currentFlashcardIndex];
        const { ease_factor, repetitions, interval } = updateFlashcardSRSData(flashcard, rating);

        const nextReviewDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

        const { error } = await supabase
            .from('flashcards')
            .update({
                ease_factor,
                repetitions,
                interval,
                last_reviewed: new Date().toISOString(),
                next_review: nextReviewDate.toISOString(),
            })
            .eq('id', flashcard.id);

        if (error) {
            console.error('Error updating flashcard:', error);
            return;
        }

        setShowAnswer(false);
        setCurrentFlashcardIndex((prevIndex) => prevIndex + 1);
    }, [flashcards, currentFlashcardIndex, supabase]);


    useEffect(() => {
        const fetchDueFlashcards = async () => {
            if (!subject) { // Don't fetch if subject is not set yet
                setLoading(false); // Potentially set loading to false if subject is required but missing
                return;
            }
            setLoading(true); // Set loading true at the start of fetch

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
            if (!userData) {
                console.error('No user data found for supabase_user_id:', supabaseUserId);
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
            } else {
                setFlashcards(dueFlashcards || []);
            }
            setLoading(false);
        };

        fetchDueFlashcards();
    }, [subject, supabase]); // Runs when subject or supabase client changes

    useEffect(() => {
        const handleKeyDown = (e) => {
            const keyToRating = {
                '1': 0, // Again
                '2': 1, // Hard
                '3': 3, // Good
                '4': 4, // Easy
                '5': 5, // Very Easy
            };
    
            if (showAnswer && keyToRating.hasOwnProperty(e.key)) { // Only if answer is shown
                e.preventDefault();
                handleRating(keyToRating[e.key]);
            } else if (!showAnswer && (e.key === 'Enter' || e.key === ' ')) { // Show answer on Enter/Space
                e.preventDefault();
                setShowAnswer(true);
            }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleRating, showAnswer]); // Depends on the memoized handleRating and showAnswer state

    const handleShowAnswer = useCallback(() => {
        setShowAnswer(true);
    }, []);

    const handleRemoveFlashcard = useCallback(async (flashcardId) => {
        // Optional: Add a confirmation dialog here
        // if (!window.confirm("Are you sure you want to remove this flashcard?")) {
        //     return;
        // }

        const { error } = await supabase
            .from('flashcards')
            .delete()
            .eq('id', flashcardId);

        if (error) {
            console.error('Error removing flashcard:', error);
            return;
        }

        setFlashcards(prevFlashcards => prevFlashcards.filter((flashcard) => flashcard.id !== flashcardId));
        // If the removed card was the current one, and it's now out of bounds,
        // but there are still other cards, we might not need to adjust currentFlashcardIndex
        // as the map will just render fewer items.
        // If it was the last card being displayed from the current set,
        // currentFlashcardIndex might become >= flashcards.length, handled by render logic.
    }, [supabase]);


    if (loading) {
        return <LoadingScreen />;
    }

    if (!subject) {
         return (
            <div className="fixed inset-0 bg-gradient-to-br from-orange-500 to-purple-500 text-black flex justify-center items-center pt-20 overflow-hidden">
                <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-md text-center">
                    <p className="text-2xl mb-4">No subject selected for review.</p>
                </div>
            </div>
        );
    }
    
    if (flashcards.length === 0) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-orange-500 to-purple-500 text-black flex justify-center items-center pt-20 overflow-hidden">
                <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-md text-center">
                    <p className="text-2xl mb-4">No flashcards due for review in {subject}.</p>
                </div>
            </div>
        );
    }

    if (currentFlashcardIndex >= flashcards.length) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-orange-500 to-purple-500 text-black flex justify-center items-center pt-20 overflow-hidden">
                <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-md text-center">
                    <p className="text-2xl mb-4">All flashcards for {subject} reviewed for this session!</p>
                </div>
            </div>
        );
    }

    // This should not happen if previous checks are correct, but as a fallback:
    const currentFlashcard = flashcards[currentFlashcardIndex];
    if (!currentFlashcard) {
        console.error("Current flashcard is undefined, though checks passed.");
        return (
             <div className="fixed inset-0 bg-gradient-to-br from-orange-500 to-purple-500 text-black flex justify-center items-center pt-20 overflow-hidden">
                <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-md text-center">
                    <p className="text-2xl mb-4">Error loading flashcard content.</p>
                </div>
            </div>
        );
    }

    const ratingColors = {
        0: "bg-red-500 hover:bg-red-600",
        1: "bg-orange-500 hover:bg-orange-600",
        3: "bg-blue-500 hover:bg-blue-600",
        4: "bg-green-500 hover:bg-green-600",
        5: "bg-teal-500 hover:bg-teal-600",
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-orange-500 to-purple-500 text-black flex justify-center items-center p-4 pt-20 overflow-hidden">
            <div className="w-full max-w-2xl"> {/* Adjusted max-width for better focus */}
                {/* Stacking effect can be complex with many cards; showing one primary card clearly is often better */}
                {/* Current Flashcard Display */}
                <div className="bg-white p-6 shadow-2xl rounded-lg w-full text-center relative min-h-[350px] flex flex-col justify-between">
                    <button
                        onClick={() => handleRemoveFlashcard(currentFlashcard.id)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-sm"
                        title="Remove this flashcard"
                    >
                        {/* Simple X or trash icon would be good here */}
                        × Remove 
                    </button>

                    <div className="flex-grow overflow-y-auto py-4"> {/* Scrollable content area */}
                        <div className="text-xl md:text-2xl font-semibold mb-2">
                           {/* Sanitize or ensure HTML is not rendered if 'front' can contain HTML */}
                           {currentFlashcard.front}
                        </div>
                        {showAnswer && (
                            <div className="text-lg md:text-xl mt-4 pt-4 border-t border-gray-200">
                                {/* Sanitize or ensure HTML is not rendered if 'back' can contain HTML */}
                                {currentFlashcard.back}
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="mt-4">
                        {!showAnswer ? (
                            <button
                                onClick={handleShowAnswer}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg w-full text-lg transition-colors duration-150"
                            >
                                Show Answer (Space/Enter)
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {[
                                    { label: 'Again', value: 0, keyHint: '1' },
                                    { label: 'Hard', value: 1, keyHint: '2' },
                                    { label: 'Good', value: 3, keyHint: '3' },
                                    { label: 'Easy', value: 4, keyHint: '4' },
                                    { label: 'V. Easy', value: 5, keyHint: '5' },
                                ].map((ratingOpt) => (
                                    <button
                                        key={ratingOpt.value}
                                        onClick={() => handleRating(ratingOpt.value)}
                                        className={`${ratingColors[ratingOpt.value]} text-white py-3 px-2 rounded-lg font-medium text-sm md:text-base transition-transform duration-100 hover:scale-105`}
                                        title={`Rate as ${ratingOpt.label} (Press ${ratingOpt.keyHint})`}
                                    >
                                        {ratingOpt.label} <span className="hidden sm:inline">({ratingOpt.keyHint})</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {/* Optional: Progress indicator */}
                {flashcards.length > 0 && (
                    <div className="text-center text-white mt-4 text-sm">
                        Card {Math.min(currentFlashcardIndex + 1, flashcards.length)} of {flashcards.length} for {subject}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewFlashcardsClient;