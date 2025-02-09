"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import '../globals.css';

const Dashboard = () => {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [studyStreak, setStudyStreak] = useState(0);
  const [username, setUsername] = useState('');
  const [studyGoal, setStudyGoal] = useState(0);
  const recommended = subjects.length > 0 ? `${subjects[0].subject} (${subjects[0].higher_level ? 'Higher' : 'Ordinary'})` : 'No subjects available';

  useEffect(() => {
    fetchUserStudyData();
  }, []);

  const fetchUserStudyData = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated. Please log in.');
      return;
    }

    const supabaseUserId = user.id;

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, username, study_time, total_time, streak')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
      return;
    }

    const userId = userData.id;
    setUsername(userData.username);
    setStudyGoal(userData.study_time);
    setTotalStudyTime(userData.total_time);
    setStudyStreak(userData.streak);

    const { data: studyData, error: studyDataError } = await supabase
      .from('user_study_data')
      .select('subject, time_spent, confidence_level, higher_level')
      .eq('user_id', userId);

    if (studyDataError) {
      console.error('Error fetching user study data:', studyDataError);
      return;
    }

    if (!studyData || studyData.length === 0) {
      console.warn('No study data found for the user.');
      return;
    }

    setSubjects(studyData);
  };

  const handleSubjectClick = (subject) => {
    router.push(`/study/${subject}`);
  };

  // Debounced confidence level update
  const debouncedConfidenceChange = useCallback(
    debounce(async (subject, newConfidenceLevel) => {
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

      // Update confidence level in the database
      const { error } = await supabase
        .from('user_study_data')
        .update({ confidence_level: newConfidenceLevel })
        .eq('user_id', userId)
        .eq('subject', subject);

      if (error) {
        console.error('Error updating confidence level:', error);
        return;
      }

      // Update local state
      setSubjects((prevSubjects) =>
        prevSubjects.map((sub) =>
          sub.subject === subject
            ? { ...sub, confidence_level: newConfidenceLevel }
            : sub
        )
      );
    }, 500), // 500ms debounce delay
    []
  );

  const handleSliderChange = (subject, newConfidenceLevel) => {
    // Update local state immediately for a responsive UI
    setSubjects((prevSubjects) =>
      prevSubjects.map((sub) =>
        sub.subject === subject
          ? { ...sub, confidence_level: newConfidenceLevel }
          : sub
      )
    );

    // Debounce the database update
    debouncedConfidenceChange(subject, newConfidenceLevel);
  };

  const progressPercentage = Math.min((totalStudyTime / studyGoal) * 100, 100);
  const progressColor = progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className="flex min-h-screen bg-gray">
      <aside className="w-1/2 pl-2 pt-2 pb-2 text-black">
        {/* Greeting Box */}
        <div className="bg-white p-6 shadow-lg rounded-lg mb-2">
          <h2 className="text-2xl font-bold text-black flex justify-between items-center">
            Hi {username || 'there'}! 👋
            <span className="text-sm text-darkGray italic">
              "Success is the sum of small efforts, repeated day in and day out."
            </span>
          </h2>
        </div>

        {/* Recommendation Box */}
        <div className="bg-orange-500 p-6 shadow-lg rounded-lg mb-2">
          <h2 className="text-2xl font-bold text-white mb-2">
            625<span className="font-normal">Tutor</span> Recommendation
          </h2>
          <div className="bg-white p-6 shadow-lg rounded-lg mb-2 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-black">
              {recommended}
            </h2>
            <div className="flex justify-end space-x-2">
              <button className="bg-orange-500 text-white p-2 rounded">
                Guided Study
              </button>
            </div>
          </div>
        </div>

        {/* Three Small Boxes */}
        <div className="flex space-x-2">
          <div className="w-1/3 bg-white p-6 shadow-lg rounded-lg mb-2">
            <h2 className="text-2xl font-bold text-black mb-4">Daily Goal</h2>
            <div className="flex justify-between items-center">
              <div className="w-full bg-gray rounded-full h-2.5">
                <div
                  className={`${progressColor} h-2.5 rounded-full`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-black">0</span>
              <span className="text-sm text-black">1 hour</span>
            </div>
          </div>
          <div className="w-1/3 bg-white p-6 shadow-lg rounded-lg mb-2">
            <h2 className="text-2xl font-bold text-black mb-4">Total Study</h2>
            <p className="text-lg text-black">
              ⏰ {Math.floor(totalStudyTime / 60).toString().padStart(2, '0')}:{(totalStudyTime % 60).toString().padStart(2, '0')}
            </p>
          </div>
          <div className="w-1/3 bg-white p-6 shadow-lg rounded-lg mb-2">
            <h2 className="text-2xl font-bold text-black mb-4">Daily Streak</h2>
            <p className="text-lg text-black">🔥 {studyStreak} days</p>
          </div>
        </div>

        {/* Confidence Level Update Box */}
        <div className="bg-white p-6 shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-black mb-4">Update Confidence Levels</h2>
          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.subject} className="bg-light-gray p-4 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  {/* Subject Name */}
                  <h3 className="text-xl font-semibold text-black">
                    {subject.subject} ({subject.higher_level ? 'Higher' : 'Ordinary'})
                  </h3>

                  {/* Slider and Current Value */}
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                        Not Confident
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={subject.confidence_level || 1}
                      onChange={(e) => handleSliderChange(subject.subject, parseInt(e.target.value))}
                      className="w-60 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm"
                    />
                    <span className="text-sm text-gray-600">
                        Very Confident
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Subjects Section */}
      <main className="w-1/2 p-2">
        <div className="bg-white p-6 shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-black">Subjects</h2>
          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.subject} className="bg-light-gray p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center mt-3">
                  <button
                    onClick={() => handleSubjectClick(subject.subject)}
                    className="font-bold text-black"
                  >
                    {subject.subject} ({subject.higher_level ? 'Higher' : 'Ordinary'})
                  </button>
                  <div className="flex space-x-2">
                    <button className="bg-orange-500 text-white p-2 rounded">
                      Guided Study
                    </button>
                    <button className="bg-blue-500 text-white p-2 rounded">
                      Flashcards
                    </button>
                    <button className="bg-green text-white p-2 rounded">
                      Exam Questions
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

// Debounce function
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

export default Dashboard;