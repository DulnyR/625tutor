// src/app/layout.js

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RootLayoutClient from './RootLayoutClient.js'; // Import our new client wrapper

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "625Tutor",
  description: "Your personal AI tutor for the Leaving Cert.",
};

// This is a valid Server Component. It contains NO hooks.
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