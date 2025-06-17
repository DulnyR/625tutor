// src/app/RootLayoutClient.js
"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from "../lib/supabaseClient";
import PdfWorkerSetup from "../lib/PdfWorkerSetup";
import LoadingScreen from "./study/loadingScreen";
import Header from "../components/Header";
import FeedbackButton from "../components/FeedbackButton";

function HeaderSkeleton() {
  // A simple placeholder with the same height as the real header.
  return <div className="w-full" style={{ height: '104px' }}></div>;
}

export default function RootLayoutClient({ children }) {
  const [streak, setStreak] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, [pathname]); // Re-fetch data on every navigation

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }
    setIsLoggedIn(true);
    const { data: userData } = await supabase.from('users').select('id, streak, username').eq('supabase_user_id', user.id).single();
    if (userData) {
      setStreak(userData.streak || 0);
      setUsername(userData.username || '');
      const { data: studyData } = await supabase.from('user_study_data').select('time_spent').eq('user_id', userData.id);
      setTotalTime(studyData ? studyData.reduce((acc, row) => acc + row.time_spent, 0) : 0);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setStreak(0);
    setTotalTime(0);
  };

  return (
    <>
      <PdfWorkerSetup />
      <Suspense fallback={<HeaderSkeleton />}>
        <Header 
          isLoggedIn={isLoggedIn}
          username={username}
          totalTime={totalTime}
          streak={streak}
          onLogout={handleLogout}
        />
      </Suspense>
      {isLoading ? <LoadingScreen /> : (
        <>
          {pathname === '/dashboard' && <FeedbackButton />}
          <div className="mt-24 pt-4">
            {children}
          </div>
        </>
      )}
    </>
  );
}