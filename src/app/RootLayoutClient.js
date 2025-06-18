// src/app/RootLayoutClient.js

"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "../lib/supabaseClient";
import PdfWorkerSetup from "../lib/PdfWorkerSetup";
import LoadingScreen from "./study/loadingScreen";
import FeedbackButton from "../components/FeedbackButton";
import MobileFallback from "../components/MobileFallback";
import { useIsMobile } from "../lib/useIsMobile";

// The Header component now lives inside the layout client for simplicity,
// as it is tightly coupled with the layout's state.
function Header({
  isLoggedIn, username, totalTime, streak, subject, 
  onMenuClick, onLogout, onHorizontalMenuToggle, 
  menuOpen, setMenuOpen, horizontalMenuOpen
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="bg-white text-black w-full py-6 fixed top-0 left-0 border-b border-gray flex items-center justify-center z-10">
      {isLoggedIn ? (
        <div className="absolute left-16">
          {subject ? (
            <span className="text-xl font-bold">📚 {subject}</span>
          ) : (
            <div className="relative">
              <button
                className="text-3xl font-bold -ml-8 focus:outline-none transition-transform transform hover:scale-110"
                onClick={onHorizontalMenuToggle}
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
          onClick={() => {
            if (!isLoggedIn) {
              router.push("/");
            } else if (!pathname.includes("study")) {
              router.push("/dashboard");
            }
          }}
        >
          <span className="font-extrabold">625</span>
          <span className="font-normal">Tutor</span>
        </h1>
        {isLoggedIn && (
          <span className="text-2xl font-bold mr-6">🔥 {streak}</span>
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
                  <li className="text-center text-blue-600 font-semibold cursor-pointer hover:bg-blue-100 py-2" onClick={() => { setMenuOpen(false); router.push("/profileSettings"); }}>
                    Profile Settings
                  </li>
                  <li className="text-center text-red-600 font-semibold cursor-pointer hover:bg-red-100 py-2" onClick={onLogout}>
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
            <li className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4" onClick={() => onMenuClick('dashboard')}>Dashboard</li>
            <li className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4" onClick={() => onMenuClick('selectConfidence')}>Update Confidence</li>
            <li className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4" onClick={() => onMenuClick('selectSubjects')}>Edit Subjects</li>
            <li className="flex-1 text-lg font-semibold hover:text-blue-600 cursor-pointer transition-colors duration-200 text-center py-4" onClick={() => onMenuClick('flashcardView')}>View Flashcards</li>
          </ol>
        </div>
      )}
    </div>
  );
}

// A component to read searchParams and pass them to the main header
// This isolates the useSearchParams hook, satisfying Next.js's rules.
function HeaderController(props) {
  const searchParams = useSearchParams();
  const subject = searchParams.get('subject');
  const finalSubject = (subject && subject.includes('Design')) ? 'Design & Communication Graphics' : subject;
  return <Header {...props} subject={finalSubject} />;
}

export default function RootLayoutClient({ children }) {
  const [streak, setStreak] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [horizontalMenuOpen, setHorizontalMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchUserData();
  }, [pathname]);

  if (isMobile) {
    return (
      <MobileFallback />
    );
  }


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
    const { data: userData } = await supabase.from('users').select('id, streak, username, last_time_studied').eq('supabase_user_id', user.id).single();
    if (userData) {
      setStreak(userData.streak || 0);
      setUsername(userData.username || '');
      checkLastTimeStudied(userData);
      const { data: studyData } = await supabase.from('user_study_data').select('time_spent').eq('user_id', userData.id);
      setTotalTime(studyData ? studyData.reduce((acc, row) => acc + row.time_spent, 0) : 0);
    }
    setIsLoading(false);
  };

  const checkLastTimeStudied = async (userData) => {
    if (!userData || !userData.last_time_studied) return;
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
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.push("/loginPage");
  };

  return (
    <>
      <PdfWorkerSetup />
      {/* Suspense is crucial for useSearchParams to work during server rendering */}
      <Suspense fallback={<div style={{ height: '104px' }} />}>
        <HeaderController
          isLoggedIn={isLoggedIn}
          username={username}
          totalTime={totalTime}
          streak={streak}
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
          onHorizontalMenuToggle={() => setHorizontalMenuOpen(!horizontalMenuOpen)}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          horizontalMenuOpen={horizontalMenuOpen}
        />
      </Suspense>

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {pathname === '/dashboard' && <FeedbackButton />}
          <div className=""> {/* Remove padding to eliminate black bar */}
            {children}
          </div>
        </>
      )}
    </>
  );
}