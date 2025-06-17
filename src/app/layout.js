// src/app/layout.js

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RootLayoutClient from './RootLayoutClient.js'; // Import the component we just made

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Optional but good practice: Add metadata
export const metadata = {
  title: "625Tutor",
  description: "Your personal AI tutor for the Leaving Cert.",
};

// This is a valid Server Component. No hooks, no "use client".
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}