"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import LoadingScreen from '../study/loadingScreen';

const FlashcardViewClient = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [filteredFlashcards, setFilteredFlashcards] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [loading, setLoading] = useState(true);
    const [editingFlashcardId, setEditingFlashcardId] = useState(null);
    const [editedQuestion, setEditedQuestion] = useState('');
    const [editedAnswer, setEditedAnswer] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [flashcardToDelete, setFlashcardToDelete] = useState(null);

    useEffect(() => {
        fetchFlashcards();
    }, []);

    useEffect(() => {
        filterAndSortFlashcards();
    }, [flashcards, selectedSubject, searchQuery, sortOrder]);

    const fetchFlashcards = async () => {
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

        const { data: userFlashcards, error: flashcardsError } = await supabase
            .from('flashcards')
            .select('*')
            .eq('user_id', userId);

        if (flashcardsError) {
            console.error('Error fetching flashcards:', flashcardsError);
            setLoading(false);
            return;
        }

        setFlashcards(userFlashcards);
        setSubjects([...new Set(userFlashcards.map(card => card.subject))]);
        setLoading(false);
    };

    const filterAndSortFlashcards = () => {
        let filtered = flashcards;

        if (selectedSubject) {
            filtered = filtered.filter(card => card.subject === selectedSubject);
        }

        if (searchQuery) {
            filtered = filtered.filter(card =>
                card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.back.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        filtered.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.front.localeCompare(b.front);
            } else {
                return b.front.localeCompare(a.front);
            }
        });

        setFilteredFlashcards(filtered);
    };

    const handleEditFlashcard = (flashcard) => {
        setEditingFlashcardId(flashcard.id);
        setEditedQuestion(flashcard.front);
        setEditedAnswer(flashcard.back);
    };

    const handleConfirmEdit = async (flashcard) => {
        setLoading(true);

        const { error: deleteError } = await supabase
            .from('flashcards')
            .delete()
            .eq('id', flashcard.id);

        if (deleteError) {
            console.error('Error removing old flashcard:', deleteError);
            setLoading(false);
            return;
        }

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

        const updatedFlashcard = {
            subject: flashcard.subject,
            front: editedQuestion,
            back: editedAnswer,
            user_id: userId,
        };

        const { error: insertError } = await supabase
            .from('flashcards')
            .insert([updatedFlashcard]);

        if (insertError) {
            console.error('Error adding updated flashcard:', insertError);
            setLoading(false);
            return;
        }

        setFlashcards(flashcards.map(fc => (fc.id === flashcard.id ? { ...updatedFlashcard, id: flashcard.id } : fc)));
        setEditingFlashcardId(null);
        setLoading(false);
    };

    const handleRemoveFlashcard = async () => {
        if (!flashcardToDelete) return;

        const { error } = await supabase
            .from('flashcards')
            .delete()
            .eq('id', flashcardToDelete);

        if (error) {
            console.error('Error removing flashcard:', error);
            return;
        }

        setFlashcards(flashcards.filter((flashcard) => flashcard.id !== flashcardToDelete));
        setFlashcardToDelete(null);
        setIsConfirmModalOpen(false);
    };

    const openConfirmModal = (flashcardId) => {
        setFlashcardToDelete(flashcardId);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setFlashcardToDelete(null);
        setIsConfirmModalOpen(false);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 text-black items-center pb-40 mt-16">
            <div className="w-1/2 max-w-6xl pt-20">
                <div className="bg-white p-6 shadow-lg rounded-lg mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-black text-center">View Flashcards</h2>

                    {/* Filters */}
                    <div className="flex flex-wrap justify-between mb-4">
                        <div className="mb-4 w-full md:w-3/5">
                            <label className="block text-black mb-2">Search Flashcards</label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by content"
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>

                        <div className="mb-4 w-full md:w-1/3">
                            <label className="block text-black mb-2">Filter by Subject</label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="">All Subjects</option>
                                {subjects.map((subject, index) => (
                                    <option key={index} value={subject}>
                                        {subject}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Flashcards List */}
                <div className="bg-white p-6 shadow-lg rounded-lg">
                    <h3 className="text-xl font-bold text-black mb-4 text-center">Flashcards</h3>
                    {filteredFlashcards.length > 0 ? (
                        <ul className="space-y-4">
                            {filteredFlashcards.map((flashcard, index) => (
                                <li key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <div>
                                        {editingFlashcardId === flashcard.id ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={editedQuestion}
                                                    onChange={(e) => setEditedQuestion(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded mb-2"
                                                />
                                                <input
                                                    type="text"
                                                    value={editedAnswer}
                                                    onChange={(e) => setEditedAnswer(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <strong>Subject:</strong> {flashcard.subject} <br />
                                                <strong>Q:</strong> {flashcard.front} <br />
                                                <strong>A:</strong> {flashcard.back}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        {editingFlashcardId === flashcard.id ? (
                                            <button
                                                onClick={() => handleConfirmEdit(flashcard)}
                                                className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300"
                                            >
                                                Confirm
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleEditFlashcard(flashcard)}
                                                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openConfirmModal(flashcard.id)}
                                            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition duration-300"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500">No flashcards found.</p>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-bold mb-4">Confirm Deletion</h3>
                        <p className="mb-4">Are you sure you want to delete this flashcard?</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={closeConfirmModal}
                                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveFlashcard}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashcardViewClient;