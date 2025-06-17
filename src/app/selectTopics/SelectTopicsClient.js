"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const SelectTopicsClient = () => {
    const router = useRouter();
    const [topics, setTopics] = useState({});
    const [selectedTopics, setSelectedTopics] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            // Fetch topics from the topics table
            const { data: topicsData, error: topicsError } = await supabase
                .from('topics')
                .select('name, subject_name')
                .eq('subject_name', 'Mathematics');

            if (topicsError) {
                throw topicsError;
            }

            // Fetch topic groups from the topic_groups table
            const { data: topicGroupsData, error: topicGroupsError } = await supabase
                .from('topic_groups')
                .select('topic_group, topic');

            if (topicGroupsError) {
                throw topicGroupsError;
            }

            // Organize topics by groups
            const organizedTopics = topicGroupsData.reduce((acc, group) => {
                if (!acc[group.topic_group]) {
                    acc[group.topic_group] = [];
                }
                acc[group.topic_group].push(group.topic);
                return acc;
            }, {});

            setTopics(organizedTopics);
        } catch (error) {
            console.error('Error fetching topics:', error);
            setError('Error fetching topics. Please try again.');
        }
    };

    const handleCheckboxChange = (topic, subtopic) => {
        setSelectedTopics({
            ...selectedTopics,
            [subtopic]: !selectedTopics[subtopic]
        });
    };

    const handleSelectAll = () => {
        const allSelected = {};
        Object.keys(topics).forEach(topic => {
            topics[topic].forEach(subtopic => {
                allSelected[subtopic] = true;
            });
        });
        setSelectedTopics(allSelected);
    };

    const handleContinue = async () => {
        try {
            // Update the studied column for each topic in the topics table
            const updates = Object.keys(selectedTopics).map(async (subtopic) => {
                const { error: updateError } = await supabase
                    .from('topics')
                    .update({ studied: selectedTopics[subtopic] })
                    .eq('name', subtopic);

                if (updateError) {
                    console.error('Error updating studied column:', updateError);
                    return null;
                }

                return subtopic;
            });

            const results = await Promise.all(updates);

            if (results.includes(null)) {
                setError('Error updating studied column. Please try again.');
            } else {
                console.log('Selected topics:', selectedTopics);
                router.push('/examQuestion');
            }
        } catch (error) {
            console.error('Error updating studied column:', error);
            setError('Error updating studied column. Please try again.');
        }
    };

    return (
        <div className="p-6 bg-white min-h-screen text-black flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6">Which Mathematics topics have you covered so far?</h1>
            <div className="w-full max-w-2xl">
                {Object.keys(topics).map((topic) => (
                    <div key={topic} className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">{topic}</h2>
                        <div className="flex flex-wrap">
                            {topics[topic].map((subtopic) => (
                                <div key={subtopic} className="flex items-center mb-2 mr-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedTopics[subtopic] || false}
                                        onChange={() => handleCheckboxChange(topic, subtopic)}
                                        className="mr-2"
                                    />
                                    <label>{subtopic}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <div className="w-full">
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="flex items-center justify-center w-full px-4 py-2 mb-4 rounded bg-blue-500 text-white hover:bg-blue-700 transition"
                    >
                        Select All
                    </button>
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="flex items-center justify-center w-full px-4 py-2 rounded bg-green text-white hover:bg-green-700 transition"
                    >
                        Continue
                    </button>
                </div>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        </div>
    );
};

export default SelectTopicsClient;