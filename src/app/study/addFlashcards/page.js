"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import '../../globals.css';

const AddFlashcards = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [subject, setSubject] = useState('');
    const searchParams = useSearchParams();
    const subjectFromAddress = searchParams.get('subject');

    useEffect(() => {
        if (subjectFromAddress) {
            setSubject(subjectFromAddress);
        }
    }, [subjectFromAddress]);

    const handleAddFlashcard = async () => {
        if (question.trim() === '' || answer.trim() === '' || subject.trim() === '') {
            alert('Please fill in the subject, question, and answer fields.');
            return;
        }

        const newFlashcard = { subject, front: question, back: answer };
        setFlashcards([...flashcards, newFlashcard]);
        setQuestion('');
        setAnswer('');

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
            .insert([{ ...newFlashcard, user_id: userId }]);

        if (error) {
            console.error('Error saving flashcard:', error);
        }
    };

    const handleRemoveFlashcard = async (index) => {
        const flashcardToRemove = flashcards[index];

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
            .delete()
            .eq('user_id', userId)
            .eq('subject', flashcardToRemove.subject)
            .eq('front', flashcardToRemove.front)
            .eq('back', flashcardToRemove.back);

        if (error) {
            console.error('Error removing flashcard:', error);
            return;
        }

        setFlashcards(flashcards.filter((_, i) => i !== index));
    };

    const handleImportFromAnki = async () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt'; // Accept .txt files
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                console.error('No file selected.');
                return;
            }

            try {
                // Read the file as text
                const fileText = await file.text();

                // Split the file content into lines
                const lines = fileText.split('\n');

                // Parse each line into a flashcard
                const flashcards = lines.map(line => {
                    const [front, back] = line.split('\t'); // Split by tab character
                    return { front, back };
                }).filter(card => card.front && card.back); // Filter out invalid lines

                // Add the flashcards to the state
                setFlashcards((prevFlashcards) => [...prevFlashcards, ...flashcards]);

                alert(`${flashcards.length} flashcards imported successfully!`);
            } catch (error) {
                console.error('Error importing Anki deck:', error);
                alert('Failed to import Anki deck. Please check the console for details.');
            }
        };
        fileInput.click();
    };

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 text-black items-center">
            {/* Add Flashcards Box */}
            <main className="w-full max-w-2xl pt-20">
                <div className="bg-white p-6 shadow-lg rounded-lg mb-6">
                    {/* Title */}
                    <h2 className="text-2xl font-bold mb-6 text-black text-center">Add Flashcards</h2>

                    {/* Question Input */}
                    <div className="mb-4">
                        <label className="block text-black mb-2">Question</label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>

                    {/* Answer Input */}
                    <div className="mb-4">
                        <label className="block text-black mb-2">Answer</label>
                        <input
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-center space-x-4 mb-6">
                        <button
                            onClick={handleAddFlashcard}
                            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300"
                        >
                            Add Flashcard
                        </button>
                        <button
                            onClick={handleImportFromAnki}
                            className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600 transition duration-300"
                        >
                            Import from Anki
                        </button>
                    </div>
                </div>
            </main>

            {/* Flashcards List */}
            {flashcards.length > 0 && (
                <div className="w-full max-w-2xl mb-20">
                    <div className="bg-white p-6 shadow-lg rounded-lg">
                        <h3 className="text-xl font-bold text-black mb-4 text-center">Added Flashcards</h3>
                        <ul className="space-y-4">
                            {flashcards.map((flashcard, index) => (
                                <li key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <div>
                                        <strong>Q:</strong> {flashcard.front} <br />
                                        <strong>A:</strong> {flashcard.back}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFlashcard(index)}
                                        className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition duration-300"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddFlashcards;