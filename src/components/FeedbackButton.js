// src/components/FeedbackButton.js
"use client";

import React, { useEffect } from 'react';

const FeedbackButton = () => {
  // This useEffect hook will run once when the component is mounted on the page.
  useEffect(() => {
    // Check if the Tally script is already on the page to avoid adding it multiple times.
    if (document.getElementById('tally-js')) {
      return;
    }

    // If the script isn't there, create a new script element.
    const script = document.createElement('script');
    script.id = 'tally-js'; // Give it an ID so we can check for it.
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;

    // Add the script to the body of the page.
    document.body.appendChild(script);

    // This is a cleanup function. If the component were to be unmounted,
    // it would remove the script. This is good practice.
    return () => {
      const scriptElement = document.getElementById('tally-js');
      if (scriptElement) {
        document.body.removeChild(scriptElement);
      }
    };
  }, []); // The empty array [] means this effect runs only once.

  // REPLACE WITH THIS BLOCK

  return (
    <button
      data-tally-open="waXdxb"
      data-tally-layout="modal"
      data-tally-width="700"
      data-tally-align-left="1"
      data-tally-hide-title="1"
      data-tally-emoji-text="👋"
      data-tally-emoji-animation="wave"
      style={{
        position: 'fixed',
        bottom: '24px', 
        right: '24px',  
        zIndex: 1000,   
      }}

      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105"
      aria-label="Give Feedback"
    >
      {/* The SVG icon remains */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5" // Made icon slightly smaller to fit well with text
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {/* ADDED: The text for the button */}
      <span className="font-semibold text-sm">Leave Feedback</span>
    </button>
  );
};

export default FeedbackButton;