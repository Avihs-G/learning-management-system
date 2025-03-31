// Ensure Supabase is loaded first
if (typeof supabase === "undefined") {
    console.error("Supabase library is not loaded.");
}

// Initialize Supabase
const SUPABASE_URL = "https://xrnqvtsjmtbxgkdvykrn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybnF2dHNqbXRieGdrZHZ5a3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDM4NzIsImV4cCI6MjA1ODk3OTg3Mn0.TX-krSoOERfe1AiWAVj5hldgvVRZMLzMBcS4yxJuk1w";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sign-up function
async function signup() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    if (email.toLowerCase().includes("admin")) {
        alert("Admin accounts cannot be created this way.");
        return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        console.error("Signup Error:", error.message);
        alert("Signup failed: " + error.message);
        return;
    }

    const role = determineUserRole(email);

    // Store user role in Supabase
    const { error: dbError } = await supabase
        .from("users")
        .insert([{ id: data.user.id, email: email, role: role, created_at: new Date() }]);

    if (dbError) {
        console.error("Database Error:", dbError.message);
        alert("Error storing user data.");
        return;
    }

    alert("Account created! Check your email for verification.");
}

// Login function
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error("Login Error:", error.message);
        alert("Login failed: " + error.message);
        return;
    }

    const user = data.user;

    if (!user) {
        alert("Login failed. No user data received.");
        return;
    }

    // Fetch user role from Supabase
    const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (roleError || !userData) {
        console.error("Role Fetch Error:", roleError?.message);
        alert("User role not found.");
        return;
    }

    localStorage.setItem("userRole", userData.role);

    alert("Login successful!");
    window.location.href = "dashboard.html";
}

// Determine user role
function determineUserRole(email) {
    const adminEmails = ["admin@avihs-g.github.io"];
    const teacherEmails = ["teacher@avihs-g.github.io"];

    const lowercaseEmail = email.toLowerCase();

    if (adminEmails.includes(lowercaseEmail)) return "admin";
    if (teacherEmails.includes(lowercaseEmail)) return "teacher";

    return "student";
}

// Logout function
async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Logout Error:", error.message);
        alert("Logout failed: " + error.message);
        return;
    }

    localStorage.removeItem("userRole");
    window.location.href = "index.html";
}

// Authentication check
async function checkAuthState() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
        window.location.href = "index.html"; // Redirect to login page if not authenticated
        return;
    }

    const user = data.session.user;

    // Fetch user role
    const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (roleError || !userData) {
        console.error("Role Fetch Error:", roleError?.message);
        return;
    }

    document.getElementById("user-welcome").textContent = `Welcome, ${user.email}`;
    loadDashboardContent(userData.role);
}

// Run auth check on dashboard page
if (window.location.pathname.includes("dashboard.html")) {
    checkAuthState();
}
