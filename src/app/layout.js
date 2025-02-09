"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated. Please log in.');
      return;
    }

    const supabaseUserId = user.id;

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('streak, total_time')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
      return;
    }

    setStreak(userData.streak);
    setTotalTime(userData.total_time);
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Banner */}
        <div className="bg-primary text-black w-full py-6 fixed top-0 left-0 border-b border-gray">
          <div className="flex items-center justify-center gap-12">
            {/* Add "0:00" on the left, slightly spaced */}
            <span className="text-2xl font-bold">⏰ {Math.floor(totalTime / 60).toString().padStart(2, '0')}:{(totalTime % 60).toString().padStart(2, '0')}</span>

            {/* Center "625 Tutor" */}
            <h1 className="text-5xl font-bold text-center">
              <span className="font-extrabold">625</span>
              <span className="font-normal">Tutor</span>
            </h1>

            {/* Move fire and "0" slightly to the right */}
            <span className="text-2xl font-bold">
              🔥 {streak}
            </span>
          </div>
        </div>
        <div className="mt-24">
          {children}
        </div>
      </body>
    </html>
  );
}