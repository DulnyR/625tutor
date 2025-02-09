"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import './globals.css';

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleAuth = async () => {
    setError(null);
    if (isLogin) {
        // Login
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
            setError(signInError.message);
        } else {
            // Check if the user exists in the users table
            const { data: existingUser, error: existingUserError } = await supabase
                .from('users')
                .select('id, supabase_user_id')
                .eq('email', email)
                .single();

            if (existingUserError || !existingUser) {
                setError('User not found in the users table.');
            } else {
                // Update the supabase_user_id if it is not already set
                if (!existingUser.supabase_user_id) {
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ supabase_user_id: signInData.user.id })
                        .eq('id', existingUser.id);

                    if (updateError) {
                        setError(updateError.message);
                    } else {
                        router.push("/selectSubjects");
                    }
                } else {
                    router.push("/selectSubjects");
                }
            }
        }
    } else {
        // Register
        const { data: existingUser, error: existingUserError } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            setError('Email is already used for a different account.');
        } else {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
            if (signUpError) {
                setError(signUpError.message);
            } else {
                // Save the username and supabase_user_id to the user's profile
                const { error: profileError } = await supabase
                    .from('users')
                    .insert([{ email, username, supabase_user_id: signUpData.user.id }]);
                if (profileError) {
                    setError(profileError.message);
                } else {
                    router.push("/emailVerification");
                }
            }
        }
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetPassword`,
    });
    if (error) {
      setError(error.message);
    } else {
      setError('Password reset email sent. Please check your inbox.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-primary" style={{ minHeight: 'calc(86vh)' }}>
      <div className="flex flex-col items-center">
        <p className="text-lg text-black mb-4">{isLogin ? "Login" : "Register"}</p>
        {!isLogin && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-2 px-4 py-2 border rounded text-black"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 px-4 py-2 border rounded text-black"
        />
        {!isForgotPassword && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 px-4 py-2 border rounded text-black"
          />
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!isForgotPassword ? (
          <>
            <button
              onClick={handleAuth}
              className="px-6 py-3 bg-secondary text-white text-lg rounded-lg transition hover:ring-2 hover:ring-offset-2 hover:ring-secondary"
            >
              {isLogin ? "Login" : "Register"}
            </button>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mt-4 text-blue-500"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
            {isLogin && (
              <button
                onClick={() => setIsForgotPassword(true)}
                className="mt-4 text-blue-500"
              >
                Forgot Password?
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleForgotPassword}
              className="px-6 py-3 bg-secondary text-white text-lg rounded-lg transition hover:ring-2 hover:ring-offset-2 hover:ring-secondary"
            >
              Reset Password
            </button>
            <button
              onClick={() => setIsForgotPassword(false)}
              className="mt-4 text-blue-500"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
