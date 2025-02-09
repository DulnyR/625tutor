"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import '../globals.css';

const SelectConfidence = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const subjectsQuery = searchParams.get('subjects');
    const levelsQuery = searchParams.get('levels');

    const [subjects, setSubjects] = useState([]);
    const [confidenceLevels, setConfidenceLevels] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        if (subjectsQuery && levelsQuery) {
            const subjectsArray = subjectsQuery.split(',');
            const levelsArray = levelsQuery.split(',');
            const subjectsData = subjectsArray.map((subject, index) => ({
                name: subject,
                level: levelsArray[index],
            }));
            setSubjects(subjectsData);

            const initialConfidenceLevels = subjectsArray.reduce((acc, subject) => {
                acc[subject] = 5; // Default confidence level
                return acc;
            }, {});
            setConfidenceLevels(initialConfidenceLevels);
        }
    }, [subjectsQuery, levelsQuery]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSliderChange = (subjectName, value) => {
        setConfidenceLevels({
            ...confidenceLevels,
            [subjectName]: value,
        });
    };

    const allConfidenceLevelsSet = subjects.every(subject => confidenceLevels[subject.name] !== undefined);

    const handleContinue = async () => {
        if (allConfidenceLevelsSet) {
            // Check if user is authenticated
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                setError('User not authenticated. Please log in.');
                return;
            }

            const supabaseUserId = user.id;

            // Fetch the user from the users table using the Supabase user ID
            const { data: userData, error: userFetchError } = await supabase
                .from('users')
                .select('id')
                .eq('supabase_user_id', supabaseUserId)
                .single();

            if (userFetchError || !userData) {
                setError('User not found in the users table.');
                return;
            }

            const userId = userData.id;

            // Update the confidence_level for each subject in the user_study_data table
            const updates = subjects.map(async (subject) => {
                const { error: updateError } = await supabase
                    .from('user_study_data')
                    .update({ confidence_level: confidenceLevels[subject.name] })
                    .eq('user_id', userId)
                    .eq('subject', subject.name);

                if (updateError) {
                    console.error('Error updating confidence level:', updateError);
                    return null;
                }

                return subject.name;
            });

            const results = await Promise.all(updates);

            if (results.includes(null)) {
                setError('Error updating confidence levels. Please try again.');
            } else {
                router.push('/selectTopics');
            }
        }
    };

    return (
        <div className="p-6 bg-white min-h-screen text-black flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6">How Confident Are You In These Subjects?</h1>
            <div className="w-full max-w-2xl">
                {subjects.map((subject) => (
                    <div key={subject.name} className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">{subject.name} ({subject.level})</h2>
                        <div className="flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={confidenceLevels[subject.name] || 5}
                                onChange={(e) => handleSliderChange(subject.name, e.target.value)}
                                className="w-full"
                            />
                            <span className="ml-4">{confidenceLevels[subject.name]}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                            <span>No Confidence</span>
                            <span>Extremely Confident</span>
                        </div>
                    </div>
                ))}
                <div className="w-full">
                    <button
                        type="button"
                        onClick={handleContinue}
                        className={`flex items-center justify-center w-full px-4 py-2 rounded transition ${allConfidenceLevelsSet ? 'bg-green text-white hover:bg-green-700' : 'bg-gray cursor-not-allowed'}`}
                        disabled={!allConfidenceLevelsSet}
                    >
                        Continue
                    </button>
                </div>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>
    );
};

export default SelectConfidence;