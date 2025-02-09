"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import '../globals.css';

const AddFlashcards = () => {
    const router = useRouter();
    const [flashcards, setFlashcards] = useState([]);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [subject, setSubject] = useState('');
    const [subjects, setSubjects] = useState([]); // Add subjects state

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        const { data: subjectsData, error } = await supabase
            .from('subjects')
            .select('name');

        if (error) {
            console.error('Error fetching subjects:', error);
            return;
        }

        setSubjects(subjectsData);
    };

    const handleAddFlashcard = () => {
        if (question.trim() === '' || answer.trim() === '' || subject.trim() === '') {
            alert('Please fill in the subject, question, and answer fields.');
            return;
        }

        const newFlashcard = { subject, front: question, back: answer };
        setFlashcards([...flashcards, newFlashcard]);
        setQuestion('');
        setAnswer('');
        setSubject(''); // Reset subject field
    };

    const handleRemoveFlashcard = (index) => {
        setFlashcards(flashcards.filter((_, i) => i !== index));
    };

    const handleSaveFlashcards = async () => {
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

        const { error } = await supabase
            .from('flashcards')
            .insert(flashcards.map(flashcard => ({ ...flashcard, user_id: userId })));

        if (error) {
            console.error('Error saving flashcards:', error);
            return;
        }

        router.push('/reviewFlashcards');
    };

    return (
        <div className="flex min-h-screen bg-gray text-black">
            <main className="w-full p-6">
                <div className="bg-white p-6 shadow-lg rounded-lg">
                    <h2 className="text-2xl font-bold mb-6 text-black">Add Flashcards</h2>
                    <div className="mb-4">
                        <label className="block text-black mb-2">Subject</label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        >
                            <option value="">Select a subject</option>
                            {subjects.map((subj) => (
                                <option key={subj.name} value={subj.name}>
                                    {subj.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-black mb-2">Question</label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-black mb-2">Answer</label>
                        <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <button
                        onClick={handleAddFlashcard}
                        className="bg-blue-500 text-white p-2 rounded mb-4 mr-4"
                    >
                        Add Flashcard
                    </button>
                    <button
                        onClick={handleSaveFlashcards}
                        className="bg-green text-white p-2 rounded"
                >
                        Save and Review Flashcards
                    </button>
                    <div className="mt-6">
                        <h3 className="text-xl font-bold text-black mb-4">Flashcards</h3>
                        <ul>
                            {flashcards.map((flashcard, index) => (
                                <li key={index} className="mb-2 flex justify-between items-center">
                                    <div>
                                        <strong>Subject:</strong> {flashcard.subject} <br />
                                        <strong>Q:</strong> {flashcard.front} <br />
                                        <strong>A:</strong> {flashcard.back}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFlashcard(index)}
                                        className="bg-red-500 text-white p-2 rounded"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddFlashcards;