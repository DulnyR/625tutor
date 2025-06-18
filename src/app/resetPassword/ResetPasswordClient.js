"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionSet, setSessionSet] = useState(false);

  useEffect(() => {
    const extractTokensAndSetSession = async () => {
      if (typeof window === "undefined") return;

      console.log("Full URL:", window.location.href);
      console.log("Search params:", window.location.search);
      console.log("Hash:", window.location.hash);
      
      // Log all search params for debugging
      const allParams = {};
      searchParams.forEach((value, key) => {
        allParams[key] = value;
      });
      console.log("All search params:", allParams);

      // First try to extract tokens from URL search parameters
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const tokenType = searchParams.get("token_type");
      const type = searchParams.get("type");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      console.log("Extracted from query params:", { 
        accessToken, 
        refreshToken, 
        tokenType, 
        type, 
        error, 
        errorDescription 
      });

      // Check for errors first
      if (error) {
        console.error("Auth error from URL:", error, errorDescription);
        setError(`Authentication error: ${errorDescription || error}`);
        return;
      }

      // If no tokens in query params, check URL hash (which is more common for Supabase)
      if (!accessToken && window.location.hash) {
        const hash = window.location.hash;
        console.log("Checking URL hash:", hash);
        
        // Remove the # and parse as URLSearchParams
        const hashParams = new URLSearchParams(hash.substring(1));
        const hashAccessToken = hashParams.get("access_token");
        const hashRefreshToken = hashParams.get("refresh_token");
        const hashTokenType = hashParams.get("token_type");
        const hashType = hashParams.get("type");
        const hashError = hashParams.get("error");
        
        console.log("Extracted from hash:", { 
          hashAccessToken, 
          hashRefreshToken, 
          hashTokenType,
          hashType,
          hashError
        });
        
        if (hashError) {
          console.error("Auth error from hash:", hashError);
          setError(`Authentication error: ${hashError}`);
          return;
        }
        
        if (hashAccessToken) {
          await setSessionWithTokens(hashAccessToken, hashRefreshToken);
          return;
        }
      }

      // If we have tokens from query params, use those
      if (accessToken) {
        await setSessionWithTokens(accessToken, refreshToken);
        return;
      }

      // Check if user is already authenticated (session exists)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Current session:", session);
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("Session error: " + sessionError.message);
        return;
      }
      
      if (session && session.user) {
        console.log("User already has valid session");
        setSessionSet(true);
        setError(null);
        return;
      }

      // No tokens found anywhere and no existing session
      console.error("No tokens found in URL and no existing session");
      setError("Invalid or expired reset link. Please request a new password reset.");
    };

    const setSessionWithTokens = async (accessToken, refreshToken) => {
      try {
        // Set the session with Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Error setting session:", error);
          setError("Failed to validate reset link: " + error.message);
          return;
        }

        console.log("Session set successfully:", data);
        setSessionSet(true);
        setError(null);
      } catch (err) {
        console.error("Error setting session:", err);
        setError("Failed to validate reset link.");
      }
    };

    extractTokensAndSetSession();
  }, [searchParams]);

  const handleResetPassword = async () => {
    if (!sessionSet) {
      setError("Invalid or expired token.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password reset successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/loginPage");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
        <h1 className="text-4xl font-bold text-center text-black mb-4">Reset Password</h1>
        
        {sessionSet ? (
          <>
            <input
              type="password"
              placeholder="New Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 border rounded text-black w-full"
              disabled={loading}
              autoFocus
            />
            
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-4 py-2 border rounded text-black w-full"
              disabled={loading}
            />
            
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
            
            <button
              onClick={handleResetPassword}
              disabled={loading || !password || !confirmPassword}
              className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg transition hover:bg-blue-700 w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        ) : (
          <>
            {error ? (
              <>
                <p className="text-red-500 text-center">{error}</p>
                <button
                  onClick={() => router.push("/loginPage")}
                  className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg transition hover:bg-blue-700 w-full"
                >
                  Back to Login
                </button>
              </>
            ) : (
              <div className="text-center text-gray-500">
                Validating reset link...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
