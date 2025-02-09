"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { supabase } from '../../lib/supabaseClient';
import '../globals.css';

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

        // Prepare data for insertion
        const subjectData = selectedSubjects.map((subjectName, index) => ({
            user_id: userId,
            subject: subjectName,
            higher_level: selectedLevels[index] === 'Higher'
        }));

        console.log('Data to be inserted:', subjectData);

        // Insert data into user_study_data table
        const { data, error: insertError } = await supabase
            .from('user_study_data')
            .insert(subjectData);

        if (insertError) {
            console.error('Full error object:', insertError);
            console.error('Error message:', insertError.message);
            console.error('Error details:', insertError.details);
            console.error('Error code:', insertError.code);
            setError(`Error inserting user study data: ${insertError.message || JSON.stringify(insertError)}`);
        } else {
            console.log('Data inserted successfully:', data);
            router.push(`/selectConfidence`);
        }
    };

    return (
        <div className="p-6 bg-white min-h-screen text-black flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6">Select Your Leaving Cert Subjects</h1>
            <div className="w-full max-w-2xl">
                <form className="space-y-4">
                    {Array.from({ length: dropdowns }).map((_, index) => (
                        <div key={index} className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
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
                        className={`flex items-center justify-center px-4 py-2 rounded transition w-1/2 mr-2 ${dropdowns >= 9 ? 'bg-gray cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}`}
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
                        className={`flex items-center justify-center px-4 py-2 rounded transition w-1/2 ml-2 ${dropdowns <= 6 ? 'bg-gray cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-700'}`}
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
                    className={`flex items-center justify-center mt-6 px-4 py-2 rounded transition w-full ${allFieldsFilled ? 'bg-green text-white hover:bg-green-700' : 'bg-gray cursor-not-allowed'}`}
                    disabled={!allFieldsFilled}
                >
                    Continue
                    {!allFieldsFilled && (
                        <p className="text-black ml-2">(Fill in all fields to continue)</p>
                    )}
                </button>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>
    );
};

export default SelectSubjects;
