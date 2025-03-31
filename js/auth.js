// Initialize Supabase
const SUPABASE_URL = "https://xrnqvtsjmtbxgkdvykrn.supabase.co"; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybnF2dHNqbXRieGdrZHZ5a3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDM4NzIsImV4cCI6MjA1ODk3OTg3Mn0.TX-krSoOERfe1AiWAVj5hldgvVRZMLzMBcS4yxJuk1w"; // Replace with your Supabase Anon Key

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to sign up new users
async function signup() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    // Prevent unauthorized admin account creation
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

    // Determine default role based on email
    const role = determineUserRole(email);

    // Store user role in Supabase database
    const { error: dbError } = await supabase
        .from('users')
        .insert([{ id: data.user.id, email: email, role: role, created_at: new Date() }]);

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
        .eq('id', data.user.id)
        .single();

    if (roleError) {
        console.error('Role Fetch Error:', roleError.message);
        return;
    }

    // Store role in localStorage
    localStorage.setItem('userRole', userData.role);

    alert('Login successful!');
    window.location.href = 'dashboard.html'; // Redirect to dashboard
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

    return 'student'; // Default role
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
    window.location.href = 'index.html'; // Redirect to login page
}

// Function to check authentication state
async function checkAuthState() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        window.location.href = 'index.html'; // Redirect to login page if not authenticated
        return;
    }

    // Fetch user role
    const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (roleError) {
        console.error('Role Fetch Error:', roleError.message);
        return;
    }

    document.getElementById('user-welcome').textContent = `Welcome, ${user.email}`;
    loadDashboardContent(userData.role);
}

// Call checkAuthState on dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    checkAuthState();
}
