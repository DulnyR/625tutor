// src/components/Header.js
"use client";

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

// The Header now receives user data and logout function as props
export default function Header({ isLoggedIn, username, totalTime, streak, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [horizontalMenuOpen, setHorizontalMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  let subject = searchParams.get('subject');

  if (subject && subject.includes('Design')) {
    subject = 'Design & Communication Graphics';
  }

  const handleMenuClick = (option) => {
    setHorizontalMenuOpen(false);
    router.push(`/${option}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout(); // This updates the state in the parent component
    router.push("/loginPage");
  };

  return (
    <div className="bg-white text-black w-full py-6 fixed top-0 left-0 border-b border-gray flex items-center justify-center z-10">
      {isLoggedIn ? (
        <div className="absolute left-16">
          {subject ? ( <span className="text-xl font-bold">📚 {subject}</span> ) : (
            <div className="relative">
              <button className="text-3xl font-bold -ml-8 focus:outline-none transition-transform transform hover:scale-110" onClick={() => { setHorizontalMenuOpen(!horizontalMenuOpen); if (!horizontalMenuOpen) setMenuOpen(false); }}>
                {horizontalMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="absolute left-16">
          <button className="text-black text-xl font-bold hover:underline" onClick={() => router.push("/contact")}>
            Chat With Us
          </button>
        </div>
      )}
      <div className="flex items-center justify-center gap-12">
        {isLoggedIn && ( <span className="text-2xl font-bold">⏰ {Math.floor(totalTime / 60).toString().padStart(2, '0')}:{(totalTime % 60).toString().padStart(2, '0')}</span> )}
        <h1 className="text-5xl font-bold text-center cursor-pointer" onClick={() => router.push(isLoggedIn ? "/dashboard" : "/")}>
          <span className="font-extrabold">625</span><span className="font-normal">Tutor</span>
        </h1>
        {isLoggedIn && ( <span className="text-2xl font-bold mr-6">🔥 {streak}</span> )}
      </div>
      {isLoggedIn ? (
        <div className="absolute right-16">
          <div className="relative">
            <button className="text-xl font-bold focus:outline-none" onClick={() => { setMenuOpen(!menuOpen); if (!menuOpen) setHorizontalMenuOpen(false); }}>
              👤 <span className="hover:underline">{username}</span>
            </button>
            {menuOpen && !pathname.includes("study") && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg rounded-md">
                <ul className="py-2">
                  <li className="text-center text-blue-600 font-semibold cursor-pointer hover:bg-blue-100 py-2" onClick={() => { setMenuOpen(false); router.push("/profileSettings"); }}>Profile Settings</li>
                  <li className="text-center text-red-600 font-semibold cursor-pointer hover:bg-red-100 py-2" onClick={handleLogout}>Log Out</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute right-16">
          <button className="text-xl font-bold focus:outline-none hover:underline" onClick={() => router.push("/loginPage")}>Sign In / Register</button>
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
  );
}