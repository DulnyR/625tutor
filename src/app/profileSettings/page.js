"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const ProfileSettingsPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [existingUsername, setExistingUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch username on component mount
  useEffect(() => {
    fetchUsername();
  }, []);

  // Fetch username function
  const fetchUsername = async () => {
    console.log("Checking user authentication...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('User not authenticated. Redirecting to sign-in page.');
      setIsLoading(false);
      router.push("/loginPage");
      return;
    }

    console.log("User is authenticated:", user);

    const supabaseUserId = user.id;

    console.log("Fetching username from the database...");
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('username')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (userDataError) {
      console.error('Error fetching username:', userDataError);
      setIsLoading(false);
      return;
    }

    if (userData) {
      console.log("Username fetched:", userData.username);
      setUsername(userData.username);
      setExistingUsername(userData.username); // Set the existing username for display
    } else {
      console.warn('No username found for the user.');
    }

    setIsLoading(false);
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!username.trim()) {
      setError('Username is required.');
      setIsLoading(false);
      return;
    }

    // Check if the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError('User not authenticated.');
      setIsLoading(false);
      return;
    }

    // Update user profile in the database
    const updates = { username };

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Profile updated successfully.');
      setExistingUsername(username); // Update the displayed username
      setIsEditingUsername(false); // Close the edit mode
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
        <h1 className="text-4xl font-bold text-center text-black mb-4">Profile Settings</h1>

        {/* Username Display and Edit */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Username</label>
          {isEditingUsername ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-4 py-2 border rounded-lg text-black w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setIsEditingUsername(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg text-black">{existingUsername}</span>
              <button
                onClick={() => setIsEditingUsername(true)}
                className="text-blue-500 hover:text-blue-700"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Update Profile Button */}
        <button
          onClick={handleProfileUpdate}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg transition hover:bg-blue-700 w-full disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>

        {/* Back to Dashboard Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-blue-500 hover:text-blue-700 w-full text-center"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;