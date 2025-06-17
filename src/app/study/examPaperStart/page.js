"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import LoadingScreen from '../loadingScreen';

const ExamPaperStartPage = () => {
    const searchParams = useSearchParams();
    let subject = searchParams.get('subject');
    const chosenExam = searchParams.get('exam');
    const [flashcardsCount, setFlashcardsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    if (subject && subject.includes('Design')) {
        subject = 'Design & Communication Graphics';
    }

    useEffect(() => {
        const fetchFlashcardsCount = async () => {
            try {
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

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const { data: flashcards, error: flashcardsError } = await supabase
                    .from('flashcards')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('created_at', today.toISOString());

                if (flashcardsError) {
                    console.error('Error fetching flashcards count:', flashcardsError);
                    return;
                }

                setFlashcardsCount(flashcards.length);
            } catch (error) {
                console.error('Unexpected error:', error);
            } finally {
                setLoading(false); // Ensure loading is set to false in all cases
            }
        };

        fetchFlashcardsCount();
    }, [subject]);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center px-8">
            <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6 ml-4">
                {/* Header */}
                <h1 className="text-4xl font-bold text-center text-black mb-4">
                    {flashcardsCount === 0 ? (
                        "Good job!"
                    ) : (
                        <>
                            Good job! You have added <span className="text-orange-600">{flashcardsCount}</span> {flashcardsCount === 1 ? "flashcard" : "flashcards"} today.
                        </>
                    )}
                </h1>

                {/* Introduction Paragraph */}
                <p className="text-lg text-black leading-relaxed">
                    Now we will start exam paper study for {subject}. In this session we will have a look at {chosenExam && chosenExam.split(' ').length === 1 ? `the ${chosenExam} Paper` : `${chosenExam}`}. We will give you a question to do and you should give it your best shot. Don't worry if you don't understand it all or don't get full marks, as long as you try, you are learning. Once you're done, we will have a look at the marking scheme for the question and you will be able to correct it. Have something you weren't sure about? Don't worry, there will be a button under the marking scheme where you will be able to add flashcards so that you remember next time. Press <span className="font-semibold">Next</span> whenever you're ready to start!
                </p>
            </div>
        </div>
    );
};

export default ExamPaperStartPage;