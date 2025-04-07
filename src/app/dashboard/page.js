"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import LoadingScreen from '../study/loadingScreen';

const Dashboard = () => {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [studyStreak, setStudyStreak] = useState(0);
  const [username, setUsername] = useState('');
  const [studyGoal, setStudyGoal] = useState(0);
  const [recommended, setRecommended] = useState({ subject: 'No subjects available', higher_level: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStudyData();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchUserStudyData = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    const supabaseUserId = user.id;

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, username, study_time_today, streak, last_time_studied')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
      setLoading(false);
      return;
    }

    const userId = userData.id;
    setUsername(userData.username);
    setStudyStreak(userData.streak);

    const lastTimeStudied = new Date(userData.last_time_studied);
    const now = new Date();
    const isSameDay = lastTimeStudied.toDateString() === now.toDateString();

    if (!isSameDay) {
      // Reset study_time_today to 0 if last_time_studied is not today
      const { error } = await supabase
        .from('users')
        .update({ study_time_today: 0 })
        .eq('id', userId);

      if (error) {
        console.error('Error resetting study_time_today:', error);
        setLoading(false);
        return;
      }

      setStudyGoal(0);
    } else {
      setStudyGoal(userData.study_time_today);
    }

    const { data: studyData, error: studyDataError } = await supabase
      .from('user_study_data')
      .select('subject, time_spent, confidence_level, higher_level')
      .eq('user_id', userId);

    if (studyDataError) {
      console.error('Error fetching user study data:', studyDataError);
      setLoading(false);
      return;
    }

    if (!studyData || studyData.length === 0) {
      console.warn('No study data found for the user.');
      setLoading(false);
      return;
    }

    setSubjects(studyData);

    // Calculate the total study time by summing the time_spent values
    const totalTime = studyData.reduce((acc, row) => acc + row.time_spent, 0);
    setTotalStudyTime(totalTime);

    // Calculate recommendation
    calculateRecommendation(studyData);
    setLoading(false);
  };

  const calculateRecommendation = async (studyData) => {
    const scores = await Promise.all(studyData.map(async (subjectData) => {
      const { subject, time_spent, confidence_level } = subjectData;

      const { data: examData, error: examDataError } = await supabase
        .from('exams')
        .select('weight')
        .eq('subject', subject);

      if (examDataError) {
        console.error('Error fetching exam data:', examDataError);
        return { subject, score: Infinity }; // Use Infinity for subjects with errors
      }

      const totalWeight = examData.reduce((acc, row) => acc + row.weight, 0);
      const score = totalWeight > 0 ? (time_spent * (confidence_level + 5)) / totalWeight : Infinity;

      return { subject, score, higher_level: subjectData.higher_level };
    }));

    const recommendedSubject = scores.reduce((min, current) => current.score < min.score ? current : min, scores[0]);
    setRecommended(recommendedSubject);
  };

  const handleSubjectClick = (path, subject, level) => {
    console.log('level:', level);
    router.push(`${path}?subject=${subject}&level=${level ? 'higher' : 'ordinary'}`);
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

  const progressPercentage = Math.min((studyGoal / 60) * 100, 100); // Assuming the daily goal is 1 hour (60 minutes)
  const progressColor = progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500';

  // Function to get the capital letters from the subject name if it is longer than 20 characters
  const getAbbreviatedSubjectName = (subjectName) => {
    if (subjectName && subjectName.length > 20) {
      return subjectName
        .split(' ')
        .map(word => /[A-Z]/.test(word[0]) ? word[0] : '') // Check if the first letter is uppercase
        .join('');
    }
    return subjectName;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-gradient-to-br from-purple-300 to-blue-200 flex min-h-screen mt-24">
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
        <div className="bg-gradient-to-br from-orange-500 to-purple-500 p-6 shadow-lg rounded-lg mb-2">
          <h2 className="text-2xl font-bold text-white mb-2">
            625<span className="font-normal">Tutor</span> Recommendation
          </h2>
          <div className="bg-white p-6 shadow-xl rounded-lg mb-2 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-black">
              {getAbbreviatedSubjectName(recommended.subject)} ({recommended.higher_level ? 'Higher' : 'Ordinary'})
            </h2>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-orange-500 text-white p-2 rounded"
                onClick={() => handleSubjectClick('/study/guidedStart', recommended.subject, recommended.higher_level)}
              >
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
              <div className="w-full bg-gray-200 rounded-full h-2.5">
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
            <p className="text-xl text-black">
              ⏰ {Math.floor(totalStudyTime / 60).toString().padStart(2, '0')}:{(totalStudyTime % 60).toString().padStart(2, '0')}
            </p>
          </div>
          <div className="w-1/3 bg-white p-6 shadow-lg rounded-lg mb-2">
            <h2 className="text-2xl font-bold text-black mb-4">Daily Streak</h2>
            <p className="text-xl text-black">🔥 {studyStreak} days</p>
          </div>
        </div>

        {/* Confidence Level Update Box */}
        <div className="bg-white p-6 shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-black mb-4">Update Confidence Levels</h2>
          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.subject} className="bg-white p-4 rounded-lg shadow-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  {/* Subject Name */}
                  <h3 className="text-xl font-semibold text-black">
                    {getAbbreviatedSubjectName(subject.subject)} ({subject.higher_level ? 'Higher' : 'Ordinary'})
                  </h3>

                  {/* Slider and Current Value */}
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-black">
                      Not Confident
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={subject.confidence_level || 1}
                      onChange={(e) => handleSliderChange(subject.subject, parseInt(e.target.value))}
                      className="w-50 h-2 bg-blue-500 rounded-lg appearance-none cursor-pointer range-sm"
                    />
                    <span className="text-sm text-black">
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
              <div key={subject.subject} className="bg-white p-4 rounded-lg shadow-lg border border-purple-200">
                <div className="flex justify-between items-center mt-3">
                  <div
                    className="font-bold text-black"
                  >
                    {getAbbreviatedSubjectName(subject.subject)} ({subject.higher_level ? 'Higher' : 'Ordinary'})
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="bg-orange-500 text-white p-2 rounded"
                      onClick={() => handleSubjectClick('/study/guidedStart', subject.subject, subject.higher_level)}
                    >
                      Guided Study
                    </button>
                    <button
                      className="bg-blue-500 text-white p-2 rounded"
                      onClick={() => {
                        const subjectName = subject.subject; // Assuming subject is the current subject
                        const level = subject.higher_level ? 'higher' : 'ordinary'; // Assuming higher_level indicates the level
                        const time = 0; // Assuming overallTime is 0 for now
                        router.push(`/study/addFlashcards?overallTime=${time}&subject=${subjectName}&level=${level}&type=flashcards`);
                      }}
                    >
                      Flashcards
                    </button>
                    <button
                      className="bg-green-500 text-white p-2 rounded"
                      onClick={() => {
                        const subjectName = subject.subject; // Assuming subject is the current subject
                        const level = subject.higher_level ? 'higher' : 'ordinary'; // Assuming higher_level indicates the level
                        router.push(`/study/examRedirect?overallTime=0&subject=${subjectName}&level=${level}&type=exam`);
                      }}
                    >
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