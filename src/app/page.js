"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  useEffect(() => {
    const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
      }
    };

    handleLogout();
  }, [router]);

  const handleAuth = async () => {
    setError(null);
    if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  const handleLogin = async () => {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return;
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id, supabase_user_id')
      .eq('email', email)
      .single();

    if (existingUserError || !existingUser) {
      setError('User not found in the users table.');
      return;
    }

    if (!existingUser.supabase_user_id) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ supabase_user_id: signInData.user.id })
        .eq('id', existingUser.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }
    }

    const { data: userSubjects, error: userSubjectsError } = await supabase
      .from('user_study_data')
      .select('id')
      .eq('user_id', existingUser.id);

    if (userSubjectsError || userSubjects.length === 0) {
      router.push("/selectSubjects");
    } else {
      router.push("/dashboard");
    }
  };

  const handleRegister = async () => {
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      setError('Email is already used for a different account.');
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert([{ email, username, supabase_user_id: signUpData.user.id }]);
    if (profileError) {
      setError(profileError.message);
      return;
    }

    router.push("/emailVerification");
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
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
        <h1 className="text-4xl font-bold text-center text-black mb-4">{isLogin ? "Login" : "Register"}</h1>
        {!isLogin && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-2 px-4 py-2 border rounded text-black w-full"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 px-4 py-2 border rounded text-black w-full"
        />
        {!isForgotPassword && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 px-4 py-2 border rounded text-black w-full"
          />
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!isForgotPassword ? (
          <>
            <button
              onClick={handleAuth}
              className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg transition hover:bg-blue-700 w-full"
            >
              {isLogin ? "Login" : "Register"}
            </button>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mt-4 text-blue-500 w-full text-center"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
            {isLogin && (
              <button
                onClick={() => setIsForgotPassword(true)}
                className="mt-4 text-blue-500 w-full text-center"
              >
                Forgot Password?
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleForgotPassword}
              className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg transition hover:bg-blue-700 w-full"
            >
              Reset Password
            </button>
            <button
              onClick={() => setIsForgotPassword(false)}
              className="mt-4 text-blue-500 w-full text-center"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
