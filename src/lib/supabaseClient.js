import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://covyfsbmnzmloxmkxjak.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvdnlmc2JtbnptbG94bWt4amFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMzk3NDksImV4cCI6MjA1NDYxNTc0OX0.M_XYGARRJLSe1jBUqmFcCOMA_hh6adhK9Mod0qF5YbY";

export const supabase = createClient(supabaseUrl, supabaseKey);
