// Initialize Supabase
const SUPABASE_URL = "https://xrnqvtsjmtbxgkdvykrn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybnF2dHNqbXRieGdrZHZ5a3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDM4NzIsImV4cCI6MjA1ODk3OTg3Mn0.TX-krSoOERfe1AiWAVj5hldgvVRZMLzMBcS4yxJuk1w";

if (typeof supabase === "undefined") {
    var supabase = window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Function to sign up new users
async function signup() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    if (email.toLowerCase().includes('admin')) {
        alert('Admin accounts cannot be created through this method.');
        return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        console.error('Signup Error:', error.message);
        alert('Signup failed: ' + error.message);
        return;
    }

    const role = determineUserRole(email);

    const { error: dbError } = await supabase
        .from('users')
        .insert([{ id: data.user?.id, email, role, created_at: new Date().toISOString() }]);

    if (dbError) {
        console.error('Database Error:', dbError.message);
        alert('Error storing user data.');
        return;
    }

    alert('Account created successfully. Check your email for verification.');
}

// Function to log in users
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error('Login Error:', error.message);
        alert('Login failed: ' + error.message);
        return;
    }

    // Fetch user role from Supabase
    const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user?.id)
        .single();

    if (roleError || !userData) {
        console.error('Role Fetch Error:', roleError?.message || "User role not found.");
        alert('Login failed: User role not found.');
        return;
    }

    localStorage.setItem('userRole', userData.role);

    alert('Login successful!');
    window.location.href = 'dashboard.html';
}

// Function to determine user role based on email
function determineUserRole(email) {
    const adminEmails = ['admin@avihs-g.github.io'];
    const teacherEmails = ['teacher@avihs-g.github.io'];

    const lowercaseEmail = email.toLowerCase();

    if (adminEmails.includes(lowercaseEmail)) {
        return 'admin';
    }
    if (teacherEmails.includes(lowercaseEmail)) {
        return 'teacher';
    }

    return 'student';
}

// Function to log out users
async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout Error:', error.message);
        alert('Logout failed: ' + error.message);
        return;
    }

    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
}

// Function to check authentication state
async function checkAuthState() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        window.location.href = 'index.html';
        return;
    }

    // Fetch user role
    const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

    if (roleError || !userData) {
        console.error('Role Fetch Error:', roleError?.message || "User role not found.");
        return;
    }

    document.getElementById('user-welcome').textContent = `Welcome, ${data.user.email}`;
    loadDashboardContent(userData.role);
}

// Check authentication on dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    checkAuthState();
}
