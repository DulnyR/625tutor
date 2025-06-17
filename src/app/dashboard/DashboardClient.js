"use client";

import React, { useState, useEffect } from 'react';
//import Joyride, { STATUS } from 'react-joyride';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import LoadingScreen from '../study/loadingScreen';
import { format } from 'date-fns';

const DashboardClient = () => {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [studyStreak, setStudyStreak] = useState(0);
  const [username, setUsername] = useState('');
  const [studyGoal, setStudyGoal] = useState(0);
  const [recommended, setRecommended] = useState({ subject: 'No subjects available', higher_level: false });
  const [loading, setLoading] = useState(true);
  const [deadlines, setDeadlines] = useState([]);
  const [showAddDeadlineModal, setShowAddDeadlineModal] = useState(false);
  const [deadlineToDelete, setDeadlineToDelete] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // --- State to control Joyride visibility ---
  // const [runTutorial, setRunTutorial] = useState(false);

  // --- Fetch data on mount ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Ensure loading starts
      await fetchUserStudyData();
      await fetchDeadlines();
      setLoading(false);
    };
    fetchData();
  }, []);

  // --- Redirect if no subjects after loading ---
  useEffect(() => {
    if (!loading && subjects.length === 0) {
      // Prevent redirect loop if already on the target page
      if (typeof window !== 'undefined' && window.location.pathname !== '/selectSubjects') {
        router.push('/selectSubjects');
      }
    }
  }, [loading, subjects, router]);

  // --- Decide when to show the tutorial ---
  useEffect(() => {
    // Check if the user has seen the tutorial before (using localStorage)
    // Ensure this runs only on the client-side
    if (typeof window !== 'undefined') {
      const hasSeenTutorial = localStorage.getItem('hasSeenDashboardTutorial');

      // Run if not loading AND the user hasn't seen it before
      if (!loading && !hasSeenTutorial) {
        // Small delay to ensure elements are rendered
        const timer = setTimeout(() => {
          setRunTutorial(true);
        }, 500); // Adjust delay if needed
        return () => clearTimeout(timer); // Cleanup timer
      }
    }
  }, [loading]); // Depend only on loading state

  useEffect(() => {
    // Scroll to top on mount
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  // --- CORRECTED: Function to fetch deadlines ---
  const fetchDeadlines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Exit if no user

      // Get the internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_user_id', user.id)
        .single();

      // If there was an error fetching the user, throw it to the catch block
      if (userError) throw userError;
      if (!userData) return; // Exit if user not found in our table

      // Get the deadlines
      const { data: deadlinesData, error: deadlinesError } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', userData.id)
        .eq('is_completed', false)
        .order('due_date', { ascending: true });

      // If there was an error fetching deadlines, throw it to the catch block
      if (deadlinesError) throw deadlinesError;

      setDeadlines(deadlinesData || []);

    } catch (err) { // Using 'err' to avoid any variable name confusion
      console.error('Error fetching deadlines:', err.message);
      // Optional: Set an error state for the user
      setDeadlines([]); // Clear deadlines to prevent showing stale data
    }
  };

  const handleConfirmDelete = async () => {
    if (!deadlineToDelete) return; // Safety check

    try {
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', deadlineToDelete.id); // Use the ID from the state

      if (error) throw error;

      // Update UI
      setDeadlines(deadlines.filter(d => d.id !== deadlineToDelete.id));

    } catch (err) {
      console.error('Error deleting deadline:', err.message);
      alert('Failed to delete deadline. Please try again.');
    } finally {
      // IMPORTANT: Close the modal and reset the state regardless of success/failure
      setIsConfirmModalOpen(false);
      setDeadlineToDelete(null);
    }
  };

  const promptForDelete = (deadline) => {
    setDeadlineToDelete(deadline);
    setIsConfirmModalOpen(true);
  };

  const AddDeadlineModal = () => {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [type, setType] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!title || !subject || !dueDate || !type) {
        alert('Please fill out all fields.');
        return;
      }
      setIsSubmitting(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: userData, error: userError } = await supabase.from('users').select('id').eq('supabase_user_id', user.id).single();

        // Handle errors from getting user data
        if (userError) throw userError;
        if (!userData) throw new Error("Could not find user profile.");

        // Insert the new deadline
        const { error: insertError } = await supabase.from('deadlines').insert({
          user_id: userData.id,
          title,
          subject_name: subject,
          type,
          due_date: dueDate,
        });

        // Handle error from inserting
        if (insertError) throw insertError;

        setShowAddDeadlineModal(false); // Close modal on success
        await fetchDeadlines(); // Refresh data

      } catch (err) { // Use 'err' again for consistency
        console.error("Error adding deadline:", err.message);
        alert('Failed to add deadline. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-black">Add New Deadline</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white text-black focus:ring-black focus:border-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white text-black focus:ring-black focus:border-black"
                required
              >
                {/* --- NEW: Placeholder option --- */}
                <option value="" disabled>Select a subject...</option>
                {subjects.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white text-black focus:ring-black focus:border-black"
                required
              >
                {/* --- NEW: Placeholder option --- */}
                <option value="" disabled>Select a type...</option>
                <option>Exam</option>
                <option>Project</option>
                <option>Practical</option>
                <option>Assignment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white text-black focus:ring-black focus:border-black"
                required
              />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowAddDeadlineModal(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Deadline'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ConfirmDeleteModal = ({ onConfirm, onClose, deadlineTitle }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold mb-4 text-black">Confirm Deletion</h2>
          <p className="text-gray-600 mb-8">
            Are you sure you want to delete the deadline for
            <span className="font-semibold text-purple-600"> {deadlineTitle}</span>?
            <br /><br />
            <span className="font-bold text-red-600">This action cannot be undone.</span>
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const fetchUserStudyData = async () => {
    // Keep your original fetchUserStudyData logic exactly as it was
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated. Please log in.');
        // Optionally redirect to login
        // router.push('/loginPage');
        setLoading(false);
        return;
      }

      const supabaseUserId = user.id;

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id, username, study_time_today, streak, last_time_studied')
        .eq('supabase_user_id', supabaseUserId)
        .single();

      if (userDataError || !userData) {
        console.error('Error fetching user data:', userDataError?.message || 'User data not found.');
        setLoading(false);
        return;
      }

      const userId = userData.id;
      setUsername(userData.username);
      setStudyStreak(userData.streak);

      const lastTimeStudied = new Date(userData.last_time_studied || 0);
      const now = new Date();
      const isSameDay = lastTimeStudied.toDateString() === now.toDateString();

      if (!isSameDay) {
        // Original logic for resetting study_time_today if needed
        // const { error } = await supabase
        //   .from('users')
        //   .update({ study_time_today: 0 })
        //   .eq('id', userId);
        // if (error) console.error('Error resetting study_time_today:', error);
        setStudyGoal(0);
      } else {
        setStudyGoal(userData.study_time_today || 0);
      }

      const { data: studyData, error: studyDataError } = await supabase
        .from('user_study_data')
        .select('subject, time_spent, calc_time, confidence_level, higher_level')
        .eq('user_id', userId);

      if (studyDataError) {
        console.error('Error fetching user study data:', studyDataError);
        setSubjects([]);
        setLoading(false);
        return;
      }

      if (!studyData || studyData.length === 0) {
        console.warn('No study data found for the user.');
        setSubjects([]);
        setRecommended({ subject: 'No subjects added', higher_level: false }); // Update recommendation state
        setLoading(false);
        return;
      }

      console.log("Study Data: ", studyData);
      setSubjects(studyData);
      console.log("Subjects: ", subjects); // Note: state update might not reflect immediately here

      const totalTime = studyData.reduce((acc, row) => acc + (row.time_spent || 0), 0);
      setTotalStudyTime(totalTime);

      await calculateRecommendation(studyData); // Use await here

    } catch (error) {
      console.error("An error occurred fetching data:", error);
      // Set default/error states
      setSubjects([]);
      setRecommended({ subject: 'Error loading data', higher_level: false });
    } finally {
      setLoading(false); // Ensure loading is always set to false
    }
  };

  const calculateRecommendation = async (studyData) => {
    // Keep your original calculateRecommendation logic exactly as it was
    if (!studyData || studyData.length === 0) {
      setRecommended({ subject: 'No subjects added', higher_level: false });
      return;
    }

    try {
      const scores = await Promise.all(studyData.map(async (subjectData) => {
        const { subject, calc_time = 0, confidence_level = 0 } = subjectData; // Provide defaults

        if (!subject) return { subject: 'Invalid Subject', score: Infinity, higher_level: subjectData.higher_level };

        const { data: examData, error: examDataError } = await supabase
          .from('exams')
          .select('weight')
          .eq('subject', subject);

        if (examDataError) {
          console.error(`Error fetching exam data for ${subject}:`, examDataError);
          return { subject, score: Infinity, higher_level: subjectData.higher_level };
        }

        const totalWeight = examData?.reduce((acc, row) => acc + (row.weight || 0), 0) || 0;
        const score = totalWeight > 0 ? (calc_time * (confidence_level + 5)) / totalWeight : Infinity;

        return { subject, score, higher_level: subjectData.higher_level };
      }));

      const validScores = scores.filter(s => s.score !== Infinity);

      if (validScores.length === 0) {
        setRecommended(studyData[0] ? { subject: studyData[0].subject, higher_level: studyData[0].higher_level } : { subject: 'No recommendation', higher_level: false });
      } else {
        const recommendedSubject = validScores.reduce((min, current) => current.score < min.score ? current : min, validScores[0]);
        setRecommended(recommendedSubject);
      }

    } catch (error) {
      console.error("Error calculating recommendation:", error);
      setRecommended({ subject: 'Error calculating', higher_level: false });
    }
  };

  const handleSubjectClick = (path, subject, level) => {
    // Keep your original handleSubjectClick logic exactly as it was
    console.log('level:', level);
    // Encode subject name for URL safety
    router.push(`${path}?subject=${encodeURIComponent(subject)}&level=${level ? 'higher' : 'ordinary'}`);
  };

  // Keep your original progress calculation
  const progressPercentage = studyGoal > 0 ? Math.min((studyGoal / 60) * 100, 100) : 0;
  const progressColor = progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500';

  // Keep your original abbreviation logic
  const getAbbreviatedSubjectName = (subjectName) => {
    if (typeof subjectName !== 'string' || !subjectName) return ''; // Add safety check
    if (subjectName.length > 20) {
      const abbreviation = subjectName
        .split(' ')
        .map(word => /[A-Z]/.test(word[0]) ? word[0] : '')
        .join('');
      return abbreviation || subjectName.substring(0, 3).toUpperCase(); // Fallback if no caps
    }
    return subjectName;
  };

  // --- Define Steps for Joyride ---
  const steps = [
    {
      target: '.greeting-box',
      content: 'Welcome to 625 Tutor! Here\'s a quick tour of your dashboard.',
      disableBeacon: true,
    },
    {
      target: '.recommendation-box',
      content: 'This is your recommended subject to study based on your progress and confidence levels along with the type of study we recommend.',
    },
    {
      target: '.daily-goal-box',
      content: 'Track your daily study goal here. Aim to complete an hour of study each day!',
    },
    {
      target: '.total-study-box',
      content: 'Here you will see the total time you have studied.',
    },
    {
      target: '.streak-box',
      content: 'Here you will see how many days in a row you have studied.',
    },
    {
      target: '.deadlines-box',
      content: "This is your deadline tracker. Click the '+' button to add important dates for exams or projects and we'll help you stay on top of them!",
    },
    {
      target: '.subjects-section',
      content: 'Here are your subjects. You can start guided study, add flashcards, or practice exam questions if you want to study a specific subject.',
    },
  ];

  // --- Joyride Callback ---
  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTutorial(false); // Stop the tour
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasSeenDashboardTutorial', 'true'); // Mark as seen
      }
    }
    // You can add other actions based on different statuses (e.g., STATUS.ERROR)
    console.log('Joyride status:', status);
  };


  if (loading) {
    return <LoadingScreen />;
  }

  // --- Original JSX Layout ---
  return (
    <div className="bg-gradient-to-br from-purple-300 to-blue-200 flex mt-24" style={{ minHeight: 'calc(100vh - 6rem)' }}>
      {/* --- Joyride Component (with modifications) --- 
      <Joyride
        steps={steps}
        run={runTutorial} // Use the state variable to control run
        continuous // Go to next step on button click
        showSkipButton // Allow users to skip
        showProgress // Show step count (e.g., 2/6)
        spotlightPadding={5}
        styles={{
          options: {
            zIndex: 10000, // Ensure it's above other elements
            // You can customize colors further if you like
            arrowColor: '#fff',
            backgroundColor: '#fff',
            primaryColor: '#8b5cf6', // Purple to match theme
            textColor: '#374151',
          },
          spotlight: {
            borderRadius: 8, // Optional: Rounding to match elements
          },
          tooltip: {
            borderRadius: 6, // Style the tooltip box
          },
          // Optional: Adjust button styles slightly if needed
          buttonNext: {
            fontSize: '14px',
          },
          buttonBack: {
            fontSize: '14px',
            marginRight: 8,
          },
          buttonSkip: {
            fontSize: '14px',
            color: '#ef4444', // Red skip button
          }
        }}
        locale={{
          last: 'Finish', // <<< CHANGE 3: Change final button text
          skip: 'Skip Tour', // Optional: Customize skip button text
        }}
        callback={handleJoyrideCallback} // Handle finish/skip events
      />
      */}
      {showAddDeadlineModal && <AddDeadlineModal />}
      {isConfirmModalOpen && (
        <ConfirmDeleteModal
          deadlineTitle={deadlineToDelete?.title}
          onConfirm={handleConfirmDelete}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setDeadlineToDelete(null);
          }}
        />
      )}

      {/* --- Original Layout Structure --- */}
      <aside
        className="w-1/2 pl-2 pt-2 pb-2 text-black flex flex-col space-y-2"
        style={{ height: 'calc(100vh - 6rem)' }}
      >
        {/* Greeting Box */}
        <div className="greeting-box bg-white p-6 shadow-lg rounded-lg items-center flex-grow-0">
          <h2 className="text-2xl font-bold text-black flex justify-between items-center">
            Hi {username || 'there'}! 👋
            <span className="text-sm text-darkGray italic">
              "Success is the sum of small efforts, repeated day in and day out."
            </span>
          </h2>
        </div>

        {/* Recommendation Box */}
        <div
          className="recommendation-box bg-gradient-to-br from-orange-500 to-purple-500 p-6 shadow-lg rounded-lg flex-grow-0"
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            625<span className="font-normal">Tutor</span> Recommendation
          </h2>
          <div className="bg-white p-6 shadow-xl rounded-lg flex justify-between items-center">
            <h2 className="text-2xl font-bold text-black">
              {getAbbreviatedSubjectName(recommended.subject)} ({recommended.higher_level ? 'Higher' : 'Ordinary'})
            </h2>
            <div className="flex justify-end space-x-2">
              {/* Add check to prevent clicking button if subject is invalid/loading */}
              {recommended.subject && !['No subjects available', 'No subjects added', 'Error loading data', 'Error calculating'].includes(recommended.subject) ? (
                <button
                  className="bg-orange-500 hover:bg-orange-600 transition-colors text-white p-2 rounded"
                  onClick={() => handleSubjectClick('/study/guidedStart', recommended.subject, recommended.higher_level)}
                >
                  Guided Study
                </button>
              ) : (
                <button
                  className="bg-gray-400 text-white p-2 rounded cursor-not-allowed"
                  disabled
                >
                  Guided Study
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Three Small Boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

          {/* Stat Card 1: Daily Goal */}
          <div className="daily-goal-box bg-white p-4 shadow-lg rounded-lg flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700">Daily Goal</h3>
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <div className="flex justify-between items-baseline mt-2 w-full">
                <span className="text-sm font-medium text-black">{studyGoal.toFixed(0)} min</span>
                <span className="text-xs text-gray-500">/ 60 min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className={`${progressColor} h-2 rounded-full transition-all duration-500 ease-in-out`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Stat Card 2: Total Study */}
          <div className="total-study-box bg-white p-4 shadow-lg rounded-lg flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700">Total Study Time</h3>
              <span className="text-lg">⏰</span>
            </div>
            <p className="text-3xl font-bold text-black text-center">
              {Math.floor(totalStudyTime / 60).toString().padStart(2, '0')}:{(totalStudyTime % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-xs text-gray-500 text-center">Hours : Mins</p>
          </div>

          {/* Stat Card 3: Daily Streak */}
          <div className="streak-box bg-white p-4 shadow-lg rounded-lg flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700">Daily Streak</h3>
              <span className="text-lg">🔥</span>
            </div>
            <p className="text-4xl font-bold text-black text-center">
              {studyStreak}
            </p>
            <p className="text-sm text-gray-500 text-center">
              {studyStreak === 1 ? "day" : "days"}
            </p>
          </div>

        </div>

        {/* --- Upcoming Deadlines Box --- */}
        <div className="deadlines-box bg-white p-6 shadow-lg rounded-lg flex flex-col flex-grow overflow-hidden">
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h3 className="font-bold text-gray-700 text-2xl">Upcoming Deadlines</h3>
            <button onClick={() => setShowAddDeadlineModal(true)} className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-purple-600 transition-colors text-xl font-light">+</button>
          </div>
          <div className="space-y-4 overflow-y-scroll border-t border-gray-200 flex-grow -mx-6 px-6">
            {deadlines.length > 0 ? (
              deadlines.map(deadline => (
                <div key={deadline.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between border-l-4 border-purple-400">
                  <div>
                    <p className="font-semibold text-black">{deadline.title}</p>
                    <p className="text-sm text-gray-500">{deadline.subject_name} ({deadline.type}) - <span className="font-medium text-black">{format(new Date(deadline.due_date), 'MMM dd, yyyy')}</span></p>
                  </div>
                  <button onClick={() => promptForDelete(deadline)} className="text-gray-400 hover:text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-10">
                <p>No upcoming deadlines.</p>
                <p className="text-sm">Click the '+' to add one!</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Subjects Section */}
      <main className="w-1/2 p-2 flex flex-col" style={{ height: 'calc(100vh - 6rem)', overflow: 'hidden' }}>
        <div className="bg-white p-6 shadow-lg rounded-lg flex-grow flex flex-col overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 text-black top-0 bg-white flex-shrink-0"> {/* Added flex-shrink-0 */}
            Subjects
          </h2>
          {/* Make sure the target 'subjects-section' is on the scrollable div */}
          <div
            className="subjects-section space-y-4 overflow-y-scroll border-t border-b border-gray-200 rounded-lg flex-grow"
          >
            {subjects.length > 0 ? (
              subjects.map((subject) => (
                <div
                  key={`${subject.subject}-${subject.higher_level}`} // More robust key
                  className="bg-white p-4 rounded-lg shadow-lg border border-purple-200"
                >
                  <div className="flex justify-between items-center mt-3">
                    <div className="font-bold text-black">
                      {getAbbreviatedSubjectName(subject.subject)} ({subject.higher_level ? 'Higher' : 'Ordinary'})
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="bg-orange-500 hover:bg-orange-600 transition-colors text-white p-2 rounded"
                        onClick={() => handleSubjectClick('/study/guidedStart', subject.subject, subject.higher_level)}
                      >
                        Guided Study
                      </button>
                      <button
                        className="bg-blue-500 hover:bg-blue-600 transition-colors text-white p-2 rounded"
                        onClick={() => {
                          const subjectName = subject.subject;
                          const level = subject.higher_level ? 'higher' : 'ordinary';
                          const time = 0; // Assuming this is intended
                          router.push(`/study/addFlashcards?overallTime=${time}&subject=${encodeURIComponent(subjectName)}&level=${level}&type=flashcards`);
                        }}
                      >
                        Flashcards
                      </button>
                      <button
                        className="bg-green-500 hover:bg-green-600 transition-colors text-white p-2 rounded"
                        onClick={() => {
                          const subjectName = subject.subject;
                          const level = subject.higher_level ? 'higher' : 'ordinary';
                          router.push(`/study/examRedirect?overallTime=0&subject=${encodeURIComponent(subjectName)}&level=${level}&type=exam`);
                        }}
                      >
                        Exam Questions
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Display message if no subjects
              <div className="text-center text-gray-500 py-10">
                <p>You haven't added any subjects yet.</p>
                <button
                  onClick={() => router.push('/selectSubjects')}
                  className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Add Subjects Now
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardClient;