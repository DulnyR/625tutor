"use client";

import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride'; // Import STATUS
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
  // --- State to control Joyride visibility ---
  const [runTutorial, setRunTutorial] = useState(false);

  // --- Fetch data on mount ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Ensure loading starts
      await fetchUserStudyData();
      // setLoading(false) is handled within fetchUserStudyData
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

    } catch(error) {
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

  // --- Define Steps for Joyride (with modifications) ---
  const steps = [
    {
      target: '.greeting-box',
      content: 'Welcome to 625 Tutor! Here\'s a quick tour of your dashboard.',
      disableBeacon: true, // <<< CHANGE 1: Disable beacon for the first step
    },
    {
      target: '.recommendation-box',
      content: 'This is your recommended subject to study based on your progress and confidence levels. Click "Guided Study" to begin!',
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
      target: '.subjects-section', // Target the scrollable container
      content: 'Here are your subjects. You can start guided study, add flashcards, or practice exam questions if you want to study a specific subject. Choose any of the study options to get started!',
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
      {/* --- Joyride Component (with modifications) --- */}
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
        <div className="flex-grow flex flex-col space-y-2">
          <div className="daily-goal-box w-full bg-white p-6 shadow-lg rounded-lg flex-grow flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-black mb-4">Daily Goal</h2>
            <div className="flex justify-between items-center w-full">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`${progressColor} h-2.5 rounded-full transition-width duration-500 ease-in-out`} // Added transition
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between mt-2 w-full">
              <span className="text-sm text-black">{studyGoal.toFixed(0)} / 60 min</span> {/* Show progress */}
            </div>
          </div>
          <div className="flex space-x-2 flex-grow">
            <div className="total-study-box w-1/2 bg-white p-6 shadow-lg rounded-lg flex-grow flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-black mb-4">Total Study</h2>
              <p className="text-xl text-black">
                ⏰ {Math.floor(totalStudyTime / 60).toString().padStart(2, '0')}:{(totalStudyTime % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <div className="streak-box w-1/2 bg-white p-6 shadow-lg rounded-lg flex-grow flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-black mb-4">Daily Streak</h2>
              <p className="text-xl text-black">🔥 {studyStreak} days</p>
            </div>
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

export default Dashboard;