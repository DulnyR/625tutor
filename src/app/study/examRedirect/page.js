"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import LoadingScreen from '../loadingScreen';

const ExamRedirectPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const overallTime = searchParams.get('overallTime');
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Add this line

    useEffect(() => {
        const fetchChosenExam = async () => {
            const url = window.location.href;
            
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

                var paper = chosenExam.exam.split(' ')[0];

                if (chosenExam.exam.split(' ').length == 2) {
                    // Extract paper number from exam
                    const paperFromUrl = searchParams.get('paper');
                    paper = paperFromUrl ? Number(paperFromUrl) : Number(chosenExam.exam.split(' ')[1]);
                    console.log('Paper number to use:', paper);
                }

                // Log query parameters
                console.log('Fetching questions with:', {
                    subject: subject,
                    paper: paper,
                    higher_level: level
                });

                // Fetch a random question from the questions table
                console.log('Fetching questions...');
                const { data: questions, error: questionsError } = await supabase
                    .from('questions')
                    .select('id, subject, year, paper, higher_level, question')
                    .eq('subject', subject) // subject is text
                    .eq('paper', paper)
                    .eq('higher_level', level === "higher"); // higher_level is boolean or string

                console.log('Questions Query Results:', questions);
                console.log('Questions Query Error:', questionsError);

                if (questionsError || !questions || questions.length === 0) {
                    console.log('Error fetching questions:', questionsError);
                    if (url.includes('type')) {
                        router.push(`/study/examQuestion?overallTime=${overallTime}&subject=${subject}&level=${level}&paper=${paper}`);
                    } else if (url.includes('paper')) {
                        router.push(`/study/examQuestion?overallTime=${overallTime}&subject=${subject}&level=${level}&paper=${paper}`);
                    } else {
                        router.push(`/study/examPaperStart?overallTime=${overallTime}&subject=${subject}&level=${level}&paper=${paper}`);
                    }
                    return;
                }

                // Fetch completed counts for questions
                console.log('Fetching completed counts for questions...');
                const { data: questionsDone, error: questionsDoneError } = await supabase
                    .from('questions_done')
                    .select('question_id, completed')
                    .eq('user_id', userId);

                if (questionsDoneError) {
                    throw new Error(`Error fetching completed counts: ${questionsDoneError.message}`);
                }

                console.log('Completed counts fetched:', questionsDone);

                // Create a map of question_id to completed count
                const completedCounts = questionsDone.reduce((acc, qd) => {
                    acc[qd.question_id] = qd.completed;
                    return acc;
                }, {});

                // Group questions by their completed count
                const groupedQuestions = questions.reduce((acc, question) => {
                    const completedCount = completedCounts[question.id] || 0;
                    if (!acc[completedCount]) {
                        acc[completedCount] = [];
                    }
                    acc[completedCount].push(question);
                    return acc;
                }, {});

                // Find the group with the lowest completed count
                const lowestCompletedCount = Math.min(...Object.keys(groupedQuestions).map(Number));
                const availableQuestions = groupedQuestions[lowestCompletedCount];

                console.log('Available questions:', availableQuestions);

                if (availableQuestions.length === 0) {
                    setError('No available questions found.');
                    return;
                }

                const chosenQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

                console.log('Chosen question:', chosenQuestion);

                console.log(`url: ${url}`);

                if (url.includes('type')) {
                    router.push(`/study/examQuestion?overallTime=${overallTime}&subject=${subject}&level=${level}&paper=${chosenQuestion.paper}&question=${chosenQuestion.question}&year=${chosenQuestion.year}&type=exam`);
                } else if (url.includes('paper')) {
                    router.push(`/study/examQuestion?overallTime=${overallTime}&subject=${subject}&level=${level}&paper=${chosenQuestion.paper}&question=${chosenQuestion.question}&year=${chosenQuestion.year}`);
                } else {
                    router.push(`/study/examPaperStart?overallTime=${overallTime}&subject=${subject}&level=${level}&paper=${chosenQuestion.paper}&question=${chosenQuestion.question}&year=${chosenQuestion.year}`);
                }
            } catch (error) {
                console.error('Error fetching exam question:', error);
                setError(`Error fetching exam question: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchChosenExam();
    }, [overallTime, subject, router]);

    return <LoadingScreen />;
};

export default ExamRedirectPage;