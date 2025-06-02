"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { supabase } from '../../lib/supabaseClient';

const levels = ['Higher', 'Ordinary'];

const SelectSubjects = () => {
    const router = useRouter();
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState(Array(7).fill(''));
    const [selectedLevels, setSelectedLevels] = useState(Array(7).fill(''));
    const [dropdowns, setDropdowns] = useState(7);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchSubjects();
        fetchUserData(); // Fetch existing user data
    }, []);

    const fetchSubjects = async () => {
        const { data, error } = await supabase
            .from('subjects')
            .select('name, order')
            .order('order', { ascending: true });

        if (error) {
            console.error('Error fetching subjects:', error);
            setError('Error fetching subjects. Please try again.');
        } else {
            setSubjects(data);
        }
    };

    const fetchUserData = async () => {
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

        // Fetch existing user study data
        const { data: studyData, error: studyDataError } = await supabase
            .from('user_study_data')
            .select('subject, higher_level')
            .eq('user_id', userId);

        if (studyDataError) {
            console.error('Error fetching user study data:', studyDataError);
            setError('Error fetching user study data. Please try again.');
            return;
        }

        // Pre-fill the dropdowns with the fetched data
        if (studyData && studyData.length > 0) {
            const subjects = studyData.map(item => item.subject);
            const levels = studyData.map(item => (item.higher_level ? 'Higher' : 'Ordinary'));

            setSelectedSubjects(subjects);
            setSelectedLevels(levels);
            setDropdowns(subjects.length); // Adjust the number of dropdowns
        }
    };

    const handleSubjectChange = (index, event) => {
        const newSelectedSubjects = [...selectedSubjects];
        newSelectedSubjects[index] = event.target.value;
        setSelectedSubjects(newSelectedSubjects);
    };

    const handleLevelChange = (index, event) => {
        const newSelectedLevels = [...selectedLevels];
        newSelectedLevels[index] = event.target.value;
        setSelectedLevels(newSelectedLevels);
    };

    const addDropdown = () => {
        if (dropdowns < 9) {
            setDropdowns(dropdowns + 1);
            setSelectedSubjects([...selectedSubjects, '']);
            setSelectedLevels([...selectedLevels, '']);
        }
    };

    const removeDropdown = () => {
        if (dropdowns > 6) {
            setDropdowns(dropdowns - 1);
            setSelectedSubjects(selectedSubjects.slice(0, -1));
            setSelectedLevels(selectedLevels.slice(0, -1));
        }
    };

    const allFieldsFilled = selectedSubjects.every(subject => subject !== '') && selectedLevels.every(level => level !== '');

    const handleContinue = async () => {
        if (!allFieldsFilled) {
            setError('Please fill in all fields before continuing.');
            return;
        }

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

        // Fetch existing user study data
        const { data: existingData, error: fetchError } = await supabase
            .from('user_study_data')
            .select('id, subject, higher_level')
            .eq('user_id', userId);

        if (fetchError) {
            console.error('Error fetching existing user study data:', fetchError);
            setError('Error fetching existing user study data. Please try again.');
            return;
        }

        // Prepare data for comparison
        const newData = selectedSubjects.map((subjectName, index) => ({
            subject: subjectName,
            higher_level: selectedLevels[index] === 'Higher',
        }));

        const toInsert = [];
        const toUpdate = [];
        const toDelete = [];

        // Determine which records to insert, update, or delete
        existingData.forEach((record) => {
            const match = newData.find((item) => item.subject === record.subject);

            if (!match) {
                // Subject no longer exists in the new data, mark for deletion
                toDelete.push(record.id);
            } else if (match.higher_level !== record.higher_level) {
                // Subject exists but level has changed, mark for update
                toUpdate.push({ id: record.id, higher_level: match.higher_level });
            }
        });

        newData.forEach((item) => {
            const match = existingData.find((record) => record.subject === item.subject);

            if (!match) {
                // Subject is new, mark for insertion
                toInsert.push({ user_id: userId, ...item });
            }
        });

        // Perform database operations
        if (toDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('user_study_data')
                .delete()
                .in('id', toDelete);

            if (deleteError) {
                console.error('Error deleting user study data:', deleteError);
                setError(`Error deleting user study data: ${deleteError.message || JSON.stringify(deleteError)}`);
                return;
            }
        }

        if (toUpdate.length > 0) {
            const updatePromises = toUpdate.map((item) =>
                supabase
                    .from('user_study_data')
                    .update({ higher_level: item.higher_level })
                    .eq('id', item.id)
            );

            const updateResults = await Promise.all(updatePromises);
            const updateErrors = updateResults.filter((result) => result.error);

            if (updateErrors.length > 0) {
                console.error('Error updating user study data:', updateErrors);
                setError('Error updating user study data. Please try again.');
                return;
            }
        }

        if (toInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('user_study_data')
                .insert(toInsert);

            if (insertError) {
                console.error('Error inserting user study data:', insertError);
                setError(`Error inserting user study data: ${insertError.message || JSON.stringify(insertError)}`);
                return;
            }
        }

        console.log('Data synchronized successfully.');

        // Redirect to the next page
        router.push(`/selectConfidence`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-8">
            <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6 mt-24">
                <h1 className="text-4xl font-bold text-center text-black mb-4">Select Your Leaving Cert Subjects</h1>
                <p className="text-lg text-black text-center leading-relaxed mb-6">We recommend only adding the subjects you are planning to use for points</p>
                <div className="w-full max-w-2xl mx-auto">
                    <form className="space-y-4">
                        {Array.from({ length: dropdowns }).map((_, index) => (
                            <div key={index} className="text-black flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                                <div className="w-full md:w-1/2">
                                    <label className="text-lg font-medium w-full block mb-2">Subject</label>
                                    <select
                                        value={selectedSubjects[index]}
                                        onChange={(event) => handleSubjectChange(index, event)}
                                        className="p-2 border border-gray-300 rounded w-full"
                                    >
                                        <option value="">Select a subject</option>
                                        {subjects.map((subject) => (
                                            <option key={subject.name} value={subject.name} disabled={selectedSubjects.includes(subject.name)}>
                                                {subject.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full md:w-1/2">
                                    <label className="text-lg font-medium w-full block mb-2">Level</label>
                                    <select
                                        value={selectedLevels[index]}
                                        onChange={(event) => handleLevelChange(index, event)}
                                        className="p-2 border border-gray-300 rounded w-full"
                                    >
                                        <option value="">Select a level</option>
                                        {levels.map((level) => (
                                            <option key={level} value={level}>
                                                {level}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </form>
                    <div className="flex justify-between mt-6 w-full">
                        <button
                            type="button"
                            onClick={addDropdown}
                            className={`flex items-center justify-center px-4 py-2 rounded transition w-1/2 mr-2 ${dropdowns >= 9 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
                            disabled={dropdowns >= 9}
                        >
                            + Add Subject
                            {dropdowns >= 9 && (
                                <p className="text-red-500 ml-2">(Max 9)</p>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={removeDropdown}
                            className={`flex items-center justify-center px-4 py-2 rounded transition w-1/2 ml-2 ${dropdowns <= 6 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-700'}`}
                            disabled={dropdowns <= 6}
                        >
                            - Remove Subject
                            {dropdowns <= 6 && (
                                <p className="text-red-500 ml-2">(Min 6)</p>
                            )}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleContinue}
                        className={`flex items-center justify-center mt-6 px-4 py-2 rounded transition w-full ${allFieldsFilled ? 'bg-green-500 text-white hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                        disabled={!allFieldsFilled}
                    >
                        Continue
                        {!allFieldsFilled && (
                            <p className="text-white ml-2">(Fill in all fields to continue)</p>
                        )}
                    </button>
                    {error && <p className="text-red-500 mt-4">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default SelectSubjects;
