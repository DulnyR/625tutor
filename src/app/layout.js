"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "../lib/supabaseClient";
import LoadingScreen from "./study/loadingScreen";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [streak, setStreak] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject');

  useEffect(() => {
    console.log("Fetching user data...");
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    console.log("Checking user authentication...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('User not authenticated. Redirecting to sign-in page.');
      setIsLoggedIn(false);
      setIsLoading(false);
      router.push("/");
      return;
    }

    console.log("User is authenticated:", user);
    setIsLoggedIn(true);

    const supabaseUserId = user.id;

    console.log("Fetching user data from the database...");
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, streak, username, last_time_studied')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
      setIsLoading(false);
      return;
    }

    console.log("User data fetched:", userData);
    setStreak(userData.streak);
    setUsername(userData.username);

    const userId = userData.id;

    console.log("Fetching total time spent from the database...");
    const { data: studyData, error: studyDataError } = await supabase
      .from('user_study_data')
      .select('time_spent')
      .eq('user_id', userId);

    if (studyDataError) {
      console.error('Error fetching total time spent:', studyDataError);
      setIsLoading(false);
      return;
    }

    if (!studyData || studyData.length === 0) {
      console.warn('No study data found for the user.');
      setTotalTime(0);
      setIsLoading(false);
      return;
    }

    // Calculate the total study time by summing the time_spent values
    const totalTime = studyData.reduce((acc, row) => acc + row.time_spent, 0);
    setTotalTime(totalTime);
    setIsLoading(false);

    // Check last_time_studied and update streak if necessary
    checkLastTimeStudied(userData);
  };

  const checkLastTimeStudied = async (userData) => {
    const lastTimeStudied = new Date(userData.last_time_studied);
    const now = new Date();
    const isSameDay = lastTimeStudied.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === lastTimeStudied.toDateString();

    if (!isSameDay && !isYesterday) {
      const { error } = await supabase
        .from('users')
        .update({ streak: 0 })
        .eq('id', userData.id);

      if (error) {
        console.error('Error updating streak:', error);
        return;
      }

      setStreak(0);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuClick = (option) => {
    console.log(`Selected option: ${option}`);
    setMenuOpen(false);
    router.push(`/${option}`);
    // Add navigation or action logic here based on the selected option
  };

  console.log("Rendering layout. isLoggedIn:", isLoggedIn);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Render the loading state inside the body */}
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <>
            {/* Render the banner */}
            <div className="bg-white text-black w-full py-6 fixed top-0 left-0 border-b border-gray flex items-center justify-center">
              {/* Left content */}
              <div className="absolute left-16">
                {subject ? (
                  <span className="text-xl font-bold">📚 {subject}</span>
                ) : (
                  <div className="relative">
                    <button
                      className="text-3xl font-bold -ml-8 focus:outline-none transition-transform transform hover:scale-110"
                      onClick={toggleMenu}
                    >
                      {menuOpen ? '✕' : '☰'}
                    </button>
                  </div>
                )}
              </div>

              {/* Centered content */}
              <div className="flex items-center justify-center gap-12">
                {/* Conditionally render the time span based on isLoggedIn */}
                {isLoggedIn && (
                  <span className="text-2xl font-bold">⏰ {Math.floor(totalTime / 60).toString().padStart(2, '0')}:{(totalTime % 60).toString().padStart(2, '0')}</span>
                )}

                {/* Center "625 Tutor" */}
                <h1 className="text-5xl font-bold text-center">
                  <span className="font-extrabold">625</span>
                  <span className="font-normal">Tutor</span>
                </h1>

                {/* Conditionally render the streak span based on isLoggedIn */}
                {isLoggedIn && (
                  <span className="text-2xl font-bold mr-6">
                    🔥 {streak}
                  </span>
                )}
              </div>

              {/* Conditionally render the username based on isLoggedIn */}
              {isLoggedIn && (
                <span className="text-xl font-bold absolute right-16">
                  👤 {username}
                </span>
              )}
            </div>

            {/* Horizontal dropdown menu */}
            {menuOpen && (
              <div className="fixed top-24 left-0 w-full bg-white border-b border-gray-300 shadow-lg">
                <ol className="flex w-full text-black">
                  <li
                    className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4"
                    onClick={() => handleMenuClick('selectConfidence')}
                  >
                    Update Confidence Levels
                  </li>
                  <li
                    className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4"
                    onClick={() => handleMenuClick('profileSettings')}
                  >
                    Profile Settings
                  </li>
                  <li
                    className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4"
                    onClick={() => handleMenuClick('View Flashcards')}
                  >
                    View Flashcards
                  </li>
                </ol>
              </div>
            )}

            <div className="mt-0">
              {children}
            </div>
          </>
        )}
      </body>
    </html>
  );
}