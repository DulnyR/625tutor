"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const SelectConfidenceClient = () => {
    const router = useRouter();
    const [subjects, setSubjects] = useState([]);
    const [confidenceLevels, setConfidenceLevels] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // New state to track loading

    useEffect(() => {
        const fetchSubjects = async () => {
            // Check if user is authenticated
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                setError('User not authenticated. Please log in.');
                setIsLoading(false); // Stop loading
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
                setIsLoading(false); // Stop loading
                return;
            }

            const userId = userData.id;

            // Fetch subjects and levels from user_study_data table
            const { data: studyData, error: studyDataError } = await supabase
                .from('user_study_data')
                .select('subject, higher_level, confidence_level')
                .eq('user_id', userId);

            if (studyDataError) {
                setError('Error fetching study data.');
                setIsLoading(false); // Stop loading
                return;
            }

            const subjectsData = studyData.map((item) => ({
                name: item.subject,
                level: item.higher_level ? 'Higher' : 'Ordinary',
            }));
            setSubjects(subjectsData);

            const initialConfidenceLevels = studyData.reduce((acc, item) => {
                acc[item.subject] = item.confidence_level || 5; // Default confidence level
                return acc;
            }, {});
            setConfidenceLevels(initialConfidenceLevels);

            setIsLoading(false); // Stop loading after data is fetched
        };

        fetchSubjects();
    }, []);

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

            // Update the confidence_level and reset calc_time for each subject in the user_study_data table
            const updates = subjects.map(async (subject) => {
                const { error: updateError } = await supabase
                    .from('user_study_data')
                    .update({
                        confidence_level: confidenceLevels[subject.name],
                        calc_time: 0 // Reset calc_time to 0
                    })
                    .eq('user_id', userId)
                    .eq('subject', subject.name);

                if (updateError) {
                    console.error('Error updating confidence level and resetting calc_time:', updateError);
                    return null;
                }

                return subject.name;
            });

            const results = await Promise.all(updates);

            if (results.includes(null)) {
                setError('Error updating confidence levels. Please try again.');
            } else {
                router.push('/dashboard');
            }
        }
    };

    if (isLoading) {
        return <div className="text-center text-white">Loading...</div>; // Show loading state
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-8 mt-24">
            <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6 text-black">
                <h1 className="text-4xl font-bold text-center text-black mb-4">How Confident Are You In These Subjects?</h1>
                <div className="w-full max-w-2xl mx-auto">
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
                                <span>Not Confident At All</span>
                                <span>Extremely Confident</span>
                            </div>
                        </div>
                    ))}
                    {!isLoading && (
                        <div className="w-full">
                            <button
                                type="button"
                                onClick={handleContinue}
                                className={`flex items-center justify-center w-full px-4 py-2 rounded transition ${allConfidenceLevelsSet ? 'bg-green-500 text-white hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                                disabled={!allConfidenceLevelsSet}
                            >
                                Continue
                            </button>
                        </div>
                    )}
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default SelectConfidenceClient;