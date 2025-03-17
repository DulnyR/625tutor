"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import '../../globals.css';
import { supabase } from '../../../lib/supabaseClient';
import LoadingScreen from '../loadingScreen';

const ExamPaperStartPage = () => {
    const searchParams = useSearchParams();
    const subject = searchParams.get('subject');
    const [flashcardsCount, setFlashcardsCount] = useState(0);
    const [chosenExam, setChosenExam] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlashcardsCount = async () => {
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

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: flashcards, error: flashcardsError } = await supabase
                .from('flashcards')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', today.toISOString());

            if (flashcardsError) {
                console.error('Error fetching flashcards count:', flashcardsError);
                setLoading(false);
                return;
            }

            setFlashcardsCount(flashcards.length);
        };

        const fetchChosenExam = async () => {
            try {
                console.log('Fetching exams for subject:', subject);

                // Fetch exams for the subject
                const { data: exams, error: examsError } = await supabase
                    .from('exams')
                    .select('id, exam, weight')
                    .eq('subject', subject);

                if (examsError) {
                    throw new Error(`Error fetching exams: ${examsError.message}`);
                }

                console.log('Exams fetched:', exams);

                if (!exams || exams.length === 0) {
                    throw new Error('No exams found for the subject.');
                }

                // Fetch user exam study data
                console.log('Fetching user data...');
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    throw new Error(`Error fetching user: ${userError?.message || 'User not found'}`);
                }

                console.log('User fetched:', user);

                const supabaseUserId = user.id;

                console.log('Fetching user data from users table...');
                const { data: userData, error: userDataError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('supabase_user_id', supabaseUserId)
                    .single();

                if (userDataError) {
                    throw new Error(`Error fetching user data: ${userDataError.message}`);
                }

                console.log('User data fetched:', userData);

                const userId = userData.id;

                console.log('Fetching user exam study data...');
                const { data: userExamStudy, error: userExamStudyError } = await supabase
                    .from('user_exam_study')
                    .select('exam_id, time')
                    .eq('user_id', userId);

                if (userExamStudyError) {
                    throw new Error(`Error fetching user exam study data: ${userExamStudyError.message}`);
                }

                console.log('User exam study data fetched:', userExamStudy);

                // Calculate the lowest value of time / weight
                console.log('Calculating exam scores...');
                const examScores = exams.map(exam => {
                    const userExam = userExamStudy.find(ues => ues.exam_id === exam.id);
                    return userExam ? { ...exam, score: userExam.time / exam.weight } : null;
                }).filter(exam => exam !== null);

                console.log('Exam scores calculated:', examScores);

                if (examScores.length === 0) {
                    throw new Error('No exams found for the subject after filtering.');
                }

                const chosenExam = examScores.reduce((min, current) => current.score < min.score ? current : min, examScores[0]);

                console.log('Chosen exam:', chosenExam);

                setChosenExam(chosenExam.exam);
            } catch (error) {
                console.error('Error fetching exam question:', error);
                setError(`Error fetching exam question: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchFlashcardsCount();
        fetchChosenExam();
    }, [subject]);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center px-8">
            <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6 ml-4">
                {/* Header */}
                <h1 className="text-4xl font-bold text-center text-black mb-4">
                    {flashcardsCount === 0 ? "Good job!" : `Good job! You have added <span className="text-orange-600">${flashcardsCount}</span> ${flashcardsCount === 1 ? "flashcard" : "flashcards"} today.`}
                </h1>

                {/* Introduction Paragraph */}
                <p className="text-lg text-black leading-relaxed">
                    Now we will start exam paper study for {subject}. In this session we will have a look at {chosenExam.split(' ').length === 1 ? `the ${chosenExam} Paper` : `${chosenExam}`}. We will give you a question to do and you should give it your best shot. Don't worry if you don't understand it all or don't get full marks, as long as you try, you are learning. Once you're done, we will have a look at the marking scheme for the question and you will be able to correct it. Have something you weren't sure about? Don't worry, there will be a button under the marking scheme where you will be able to add flashcards so that you remember next time. Press <span className="font-semibold">Next</span> whenever you're ready to start!
                </p>
            </div>
        </div>
    );
};

export default ExamPaperStartPage;