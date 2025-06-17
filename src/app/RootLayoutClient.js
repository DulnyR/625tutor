// src/app/RootLayoutClient.js

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "../lib/supabaseClient";
import PdfWorkerSetup from "../lib/PdfWorkerSetup";
import LoadingScreen from "./study/loadingScreen";
import FeedbackButton from "../components/FeedbackButton";

export default function RootLayoutClient({ children }) {
  const [streak, setStreak] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [horizontalMenuOpen, setHorizontalMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  let subject = searchParams.get('subject');

  if (subject && subject.includes('Design')) {
    subject = 'Design & Communication Graphics';
  }

  // This effect will re-run whenever the user navigates to a new page.
  useEffect(() => {
    fetchUserData();
  }, [pathname]); // Dependency on pathname handles navigation changes

  const fetchUserData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoggedIn(false);
      setIsLoading(false);
      const publicRoutes = ['/contact', '/privacy', '/terms', '/loginPage', '/emailVerification'];
      if (pathname !== '/' && !publicRoutes.some(route => pathname.startsWith(route))) {
        router.push("/");
      }
      return;
    }

    setIsLoggedIn(true);

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, streak, username, last_time_studied')
      .eq('supabase_user_id', user.id)
      .single();

    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
      setIsLoading(false);
      return;
    }

    setStreak(userData.streak || 0);
    setUsername(userData.username || '');
    checkLastTimeStudied(userData);

    const { data: studyData, error: studyDataError } = await supabase
      .from('user_study_data')
      .select('time_spent')
      .eq('user_id', userData.id);

    if (studyDataError) {
      console.error('Error fetching total time spent:', studyDataError);
    }

    if (studyData) {
      const totalTimeValue = studyData.reduce((acc, row) => acc + row.time_spent, 0);
      setTotalTime(totalTimeValue);
    } else {
      setTotalTime(0);
    }

    setIsLoading(false);
  };

  const checkLastTimeStudied = async (userData) => {
    if (!userData.last_time_studied) return;
    const lastTimeStudied = new Date(userData.last_time_studied);
    const now = new Date();
    const isSameDay = lastTimeStudied.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === lastTimeStudied.toDateString();

    if (!isSameDay && !isYesterday) {
      await supabase.from('users').update({ streak: 0 }).eq('id', userData.id);
      setStreak(0);
    }
  };

  const handleMenuClick = (option) => {
    setHorizontalMenuOpen(false);
    router.push(`/${option}`);
  };

  return (
    <>
      <PdfWorkerSetup />
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {pathname === '/dashboard' && <FeedbackButton />}
          <div className="bg-white text-black w-full py-6 fixed top-0 left-0 border-b border-gray flex items-center justify-center z-10">
            {isLoggedIn ? (
              <div className="absolute left-16">
                {subject ? (
                  <span className="text-xl font-bold">📚 {subject}</span>
                ) : (
                  <div className="relative">
                    <button
                      className="text-3xl font-bold -ml-8 focus:outline-none transition-transform transform hover:scale-110"
                      onClick={() => setHorizontalMenuOpen(!horizontalMenuOpen)}
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
                  onClick={() => router.push("/contact")}
                >
                  Chat With Us
                </button>
              </div>
            )}
            <div className="flex items-center justify-center gap-12">
              {isLoggedIn && (
                <span className="text-2xl font-bold">⏰ {Math.floor(totalTime / 60).toString().padStart(2, '0')}:{(totalTime % 60).toString().padStart(2, '0')}</span>
              )}
              <h1
                className="text-5xl font-bold text-center cursor-pointer"
                onClick={() => router.push(isLoggedIn ? "/dashboard" : "/")}
              >
                <span className="font-extrabold">625</span>
                <span className="font-normal">Tutor</span>
              </h1>
              {isLoggedIn && (
                <span className="text-2xl font-bold mr-6">
                  🔥 {streak}
                </span>
              )}
            </div>
            {isLoggedIn ? (
              <div className="absolute right-16">
                <div className="relative">
                  <button
                    className="text-xl font-bold focus:outline-none"
                    onClick={() => setMenuOpen(!menuOpen)}
                  >
                    👤 <span className="hover:underline">{username}</span>
                  </button>
                  {menuOpen && !pathname.includes("study") && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg rounded-md">
                      <ul className="py-2">
                        <li
                          className="text-center text-blue-600 font-semibold cursor-pointer hover:bg-blue-100 py-2"
                          onClick={() => { setMenuOpen(false); router.push("/profileSettings"); }}
                        >
                          Profile Settings
                        </li>
                        <li
                          className="text-center text-red-600 font-semibold cursor-pointer hover:bg-red-100 py-2"
                          onClick={async () => {
                            await supabase.auth.signOut();
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
            {horizontalMenuOpen && (
              <div className="fixed top-24 left-0 w-full bg-white border-b border-gray-300 shadow-lg">
                <ol className="flex w-full text-black">
                  <li className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4" onClick={() => handleMenuClick('dashboard')}>Dashboard</li>
                  <li className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4" onClick={() => handleMenuClick('selectConfidence')}>Update Confidence</li>
                  <li className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4" onClick={() => handleMenuClick('selectSubjects')}>Edit Subjects</li>
                  <li className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4" onClick={() => handleMenuClick('flashcardView')}>View Flashcards</li>
                </ol>
              </div>
            )}
          </div>
          <div className="mt-24 pt-4">  {/* Added padding to push content below fixed header */}
            {children}
          </div>
        </>
      )}
    </>
  );
}