"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "../lib/supabaseClient";

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
  const router = useRouter();

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

  console.log("Rendering layout. isLoggedIn:", isLoggedIn);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Render the loading state inside the body */}
        {isLoading ? (
          <div>Loading...</div> // Or a loading spinner
        ) : (
          <>
            {/* Render the banner */}
            <div className="bg-primary text-black w-full py-6 fixed top-0 left-0 border-b border-gray flex items-center justify-center">
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
                  <span className="text-2xl font-bold mr-8">
                    🔥 {streak}
                  </span>
                )}
              </div>

              {/* Conditionally render the username based on isLoggedIn */}
              {isLoggedIn && (
                <span className="text-2xl font-bold absolute right-16">
                  👤 {username}
                </span>
              )}
            </div>

            <div className="mt-24">
              {children}
            </div>
          </>
        )}
      </body>
    </html>
  );
}