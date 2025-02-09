"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Extract token from URL fragment (#access_token=...)
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", "?")); // Convert fragment to query params

      const accessToken = params.get("access_token");
      setToken(accessToken);

      if (!accessToken) {
        setError("Invalid or expired reset link.");
      } else {
        // Manually set session with Supabase Auth API
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: params.get("refresh_token"),
        });
      }
    }
  }, []);

  const handleResetPassword = async () => {
    if (!token) {
      setError("Invalid or expired token.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password reset successfully. Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-primary" style={{ minHeight: "86vh" }}>
      <div className="flex flex-col items-center">
        <p className="text-lg text-black mb-4">Reset Password</p>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 px-4 py-2 border rounded text-black"
        />
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green mb-4">{success}</p>}
        <button
          onClick={handleResetPassword}
          className="px-6 py-3 bg-secondary text-white text-lg rounded-lg transition hover:ring-2 hover:ring-offset-2 hover:ring-secondary"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}
