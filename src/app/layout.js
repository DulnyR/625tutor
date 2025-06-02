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
  const [horizontalMenuOpen, setHorizontalMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  let subject = searchParams.get('subject');

  if (subject && subject.includes('Design')) {
    subject = 'Design & Communication Graphics';
  }

  useEffect(() => {
    console.log("Fetching user data...");
    fetchUserData();
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname);
      setIsLoading(true); // Optionally show loading state during refresh
      fetchUserData(); // Re-fetch user data on route change
    };

    router.events?.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const fetchUserData = async () => {
    console.log("Checking user authentication...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Check if the user is null or there is an error
    if (userError || !user) {
      console.log('User not authenticated. Redirecting to sign-in page.');
      setIsLoggedIn(false);
      setIsLoading(false);
      if (!window.location.pathname.includes('/contact') && !window.location.pathname.includes('/privacy') && !window.location.pathname.includes('/terms')) {
        router.push("/");
      }
      return;
    }

    router.push("/dashboard");

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
    setHorizontalMenuOpen(false);
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
            <div className="bg-white text-black w-full py-6 fixed top-0 left-0 border-b border-gray flex items-center justify-center z-10">
              {/* Left content */}
              {isLoggedIn ? (
                <div className="absolute left-16">
                  {subject ? (
                    <span className="text-xl font-bold">📚 {subject}</span>
                  ) : (
                    <div className="relative">
                      <button
                        className="text-3xl font-bold -ml-8 focus:outline-none transition-transform transform hover:scale-110"
                        onClick={() => {
                          setHorizontalMenuOpen(!horizontalMenuOpen);
                          if (!horizontalMenuOpen) setMenuOpen(false);
                        }}
                      >
                        {horizontalMenuOpen ? '✕' : '☰'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute left-16">
                  <button
                    className="text-black text-xl font-bold hover:underline"
                    onClick={() => window.location.href = "/contact"} // Redirect to /contact
                  >
                    Chat With Us
                  </button>
                </div>
              )}

              {/* Centered content */}
              <div className="flex items-center justify-center gap-12">
                {/* Conditionally render the time span based on isLoggedIn */}
                {isLoggedIn && (
                  <span className="text-2xl font-bold">⏰ {Math.floor(totalTime / 60).toString().padStart(2, '0')}:{(totalTime % 60).toString().padStart(2, '0')}</span>
                )}

                <h1
                  className="text-5xl font-bold text-center cursor-pointer"
                  onClick={() => {
                    if (!isLoggedIn) {
                      router.push("/"); // Redirect to "/" only if not logged in
                    }
                  }}
                >
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

              {/* Conditionally render the username dropdown or sign-in button based on isLoggedIn */}
              {isLoggedIn ? (
                <div className="absolute right-16">
                  <div className="relative">
                    <button
                      className="text-xl font-bold focus:outline-none"
                      onClick={() => {
                        setMenuOpen(!menuOpen);
                        if (!menuOpen) setHorizontalMenuOpen(false); 
                      }}
                    >
                      👤 <span className="hover:underline">{username}</span>
                    </button>
                    {menuOpen && !window.location.pathname.includes("study") && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg rounded-md">
                        <ul className="py-2">
                          <li
                            className="text-center text-blue-600 font-semibold cursor-pointer hover:bg-blue-100 py-2"
                            onClick={() => {
                              setMenuOpen(false);
                              router.push("/profileSettings");
                            }}
                          >
                            Profile Settings
                          </li>
                          <li
                            className="text-center text-red-600 font-semibold cursor-pointer hover:bg-red-100 py-2"
                            onClick={async () => {
                              console.log("Logging out...");
                              const { error } = await supabase.auth.signOut();
                              if (error) {
                                console.error("Error logging out:", error);
                                return;
                              }
                              setIsLoggedIn(false);
                              router.push("/loginPage");
                            }}
                          >
                            Log Out
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="absolute right-16">
                  <button
                    className="text-xl font-bold focus:outline-none hover:underline"
                    onClick={() => router.push("/loginPage")}
                  >
                    Sign In / Register
                  </button>
                </div>
              )}

              {/* Horizontal dropdown menu */}
              {horizontalMenuOpen && (
                <div className="fixed top-24 left-0 w-full bg-white border-b border-gray-300 shadow-lg">
                  <ol className="flex w-full text-black">
                    <li
                      className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4"
                      onClick={() => handleMenuClick('dashboard')}
                    >
                      Dashboard
                    </li>
                    <li
                      className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4"
                      onClick={() => handleMenuClick('selectConfidence')}
                    >
                      Update Confidence Levels
                    </li>
                    <li
                      className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4"
                      onClick={() => handleMenuClick('selectSubjects')}
                    >
                      Edit Subjects
                    </li>
                    <li
                      className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4"
                      onClick={() => handleMenuClick('flashcardView')}
                    >
                      View Flashcards
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <div className="mt-0">
              {children}
            </div>
          </>
        )}
      </body>
    </html>
  );
}