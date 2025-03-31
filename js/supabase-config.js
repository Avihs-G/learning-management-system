// Make sure Supabase SDK is included in your HTML before this file
const { createClient } = supabase;

// Replace with your Supabase project credentials
const SUPABASE_URL = "https://xrnqvtsjmtbxgkdvykrn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybnF2dHNqbXRieGdrZHZ5a3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDM4NzIsImV4cCI6MjA1ODk3OTg3Mn0.TX-krSoOERfe1AiWAVj5hldgvVRZMLzMBcS4yxJuk1w";

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
