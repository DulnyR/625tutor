"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient'; // Ensure this is the correct path
import { useRouter } from 'next/navigation';

const LandingPage = () => {
  const router = useRouter();
  const [radekImageUrl, setRadekImageUrl] = useState('');

  // Refs for sections
  const featuresRef = useRef(null);
  const subjectsRef = useRef(null);
  const aboutUsRef = useRef(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const { data, error } = supabase.storage
          .from('image') // Bucket name
          .getPublicUrl('radek.png'); // File name

        if (error) {
          console.error('Error fetching image:', error.message);
        } else {
          setRadekImageUrl(data.publicUrl); // Set the public URL of the image
        }
      } catch (err) {
        console.error('Unexpected error fetching image:', err);
      }
    };

    fetchImage();
  }, []);

  const subjects = [
    'English', 'Irish', 'Mathematics', 'Spanish',
    'Physics', 'DCG', 'Engineering',
    'Polish'
  ];

  const scrollToSection = (ref) => {
    if (ref.current) {
      const offset = 100; // Adjust this value to control the offset (e.g., 100px)
      const top = ref.current.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 mt-24">
      {/* Hero Section */}
      <section className="py-16 px-6 text-center pt-20 md:pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Master Your Leaving Cert With <span className="text-purple-600">Confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8">
            Access past papers, marking schemes, AI assistance, and personalized study tracking to maximize your exam performance.
          </p>
          <button
            onClick={() => router.push('/loginPage')}
            className="bg-gradient-to-r from-orange-500 to-purple-600 text-white py-3 px-8 rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-purple-700 transition duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Who Are We Section */}
      <section ref={aboutUsRef} className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">Who Are We?</h2>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-14">
            {/* Image */}
            {radekImageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={radekImageUrl}
                  alt="Radek"
                  className="rounded-full w-80 h-80 object-cover shadow-lg"
                />
              </div>
            )}
            {/* Text */}
            <div className="text-center md:text-left">
              <p className="text-lg text-gray-700 leading-relaxed">
                Hi, I’m Radek, a maths and physics tutor and Trinity College student from Co. Wicklow. Having completed the Leaving Cert myself a few years ago and worked with students from every year since, I’ve seen firsthand how easy it is to fall into unproductive study habits that waste time and lead to frustration.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-6">
                That’s why I created 625Tutor, a platform built on proven study techniques, personal experience, and insights from helping others succeed. Here, you’ll learn how to study smarter, not harder, taking the guesswork out of the process. making real progress in less time and freeing up space for the things you love.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-6">
                I know how stressful it can be to put life on hold just to chase college points and this is my way of making that journey a little easier. If you have any questions just click the button in the top left corner and I’d be happy to help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-16 px-6 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">Why Choose 625Tutor?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl transition group">
              <div className="inline-block bg-blue-100 text-blue-600 rounded-full p-3 mb-4 group-hover:scale-110 transition-transform">
                {/* Placeholder for an Icon (e.g., Book Open) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl text-gray-800 font-semibold mb-3">Comprehensive Resources</h3>
              <p className="text-gray-600">
                Access 10+ years of past papers and marking schemes for key subjects, all easily searchable.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl transition group">
              <div className="inline-block bg-purple-100 text-purple-600 rounded-full p-3 mb-4 group-hover:scale-110 transition-transform">
                {/* Placeholder for an Icon (e.g., Chart Bar) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl text-gray-800 font-semibold mb-3">Track Your Progress</h3>
              <p className="text-gray-600">
                Log completed questions, visualize study time, and identify areas needing more focus.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl transition group">
              <div className="inline-block bg-green-100 text-green-600 rounded-full p-3 mb-4 group-hover:scale-110 transition-transform">
                {/* Placeholder for an Icon (e.g., Sparkles or CPU Chip) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl text-gray-800 font-semibold mb-3">625 AI Assistant</h3>
              <p className="text-gray-600">
                Get instant help and explanations for tricky concepts directly within your study sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section ref={subjectsRef} className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">Currently Supported Subjects</h2>

          <div className="flex flex-wrap justify-center gap-4">
            {subjects.map((subject) => (
              <div
                key={subject}
                className="bg-white py-3 px-5 rounded-full shadow-sm border border-gray-200 cursor-default"
              >
                <span className="font-medium text-gray-700">{subject}</span>
              </div>
            ))}
          </div>

          <p className="text-lg text-center text-gray-600 mt-12">
            More subjects and features added regularly!
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: Brand */}
          <div>
            <h3 className="text-xl font-semibold mb-4">625Tutor</h3>
            <p className="text-gray-400 text-sm mr-20">
              Your intelligent companion for Leaving Certificate success.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => scrollToSection(featuresRef)}
                  className="text-gray-400 hover:text-white transition"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection(subjectsRef)}
                  className="text-gray-400 hover:text-white transition"
                >
                  Subjects
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection(aboutUsRef)}
                  className="text-gray-400 hover:text-white transition"
                >
                  About Us
                </button>
              </li>
              <li>
                <a href="/loginPage" className="text-gray-400 hover:text-white transition">
                  Sign In / Register
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support & Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:625tutor@gmail.com" className="text-gray-400 hover:text-white transition">625tutor@gmail.com</a></li>
              <li><a href="/privacy" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white transition">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-700">
          © {new Date().getFullYear()} 625Tutor. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;