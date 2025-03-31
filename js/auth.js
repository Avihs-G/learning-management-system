function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Check if user profile exists in Firestore
            return firebase.firestore().collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (!doc.exists) {
                        // Determine default role based on email
                        const role = determineUserRole(email);
                        
                        // Create user profile if it doesn't exist
                        return firebase.firestore().collection('users').doc(user.uid).set({
                            email: email,
                            role: role,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        // Update last login timestamp
                        return firebase.firestore().collection('users').doc(user.uid).update({
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                })
                .then(() => {
                    // Fetch user role after ensuring profile exists
                    return firebase.firestore().collection('users').doc(user.uid).get();
                });
        })
        .then((doc) => {
            const userData = doc.data();
            
            // Store role in local storage
            localStorage.setItem('userRole', userData.role);
            
            // Update welcome message
            document.getElementById('user-welcome').textContent = `Welcome, ${email}`;
            
            // Load dashboard content based on role
            loadDashboardContent(userData.role);
        })
        .catch((error) => {
            console.error('Login Error:', error);
            alert('Login failed: ' + error.message);
        });
}

function signup() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Basic validation
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    // Prevent signup of admin accounts through this method
    if (email.toLowerCase().includes('admin')) {
        alert('Admin accounts cannot be created through this method');
        return;
    }

    // Create user with Firebase Authentication
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Determine default role
            const role = determineUserRole(email);

            // Create user profile in Firestore
            return firebase.firestore().collection('users').doc(user.uid).set({
                email: email,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert('Account created successfully');
            // Optionally, automatically log in the user
            login();
        })
        .catch((error) => {
            console.error('Signup Error:', error);
            alert('Signup failed: ' + error.message);
        });
}

// Function to determine user role based on email
function determineUserRole(email) {
    // Predefined admin and teacher email domains
    const adminDomains = ['admin@dlms.com', 'admin@library.com'];
    const teacherDomains = ['teacher@dlms.com', 'instructor@library.com'];

    // Convert email to lowercase for case-insensitive comparison
    const lowercaseEmail = email.toLowerCase();

    // Check admin domains first
    if (adminDomains.some(domain => lowercaseEmail.endsWith(domain))) {
        return 'admin';
    }

    // Check teacher domains
    if (teacherDomains.some(domain => lowercaseEmail.endsWith(domain))) {
        return 'teacher';
    }

    // Default to student
    return 'student';
}

function logout() {
    firebase.auth().signOut()
        .then(() => {
            // Clear local storage
            localStorage.removeItem('userRole');
            
            // Redirect to index page
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Logout Error', error);
            alert('Logout failed: ' + error.message);
        });
}

// Authentication State Observer
// In auth.js

// Authentication State Observer
firebase.auth().onAuthStateChanged((user) => {
    console.group('Authentication State Change');
    console.log('User:', user ? user.email : 'Not logged in');

    // Find elements with detailed logging
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard');

    console.log('DOM Elements:', {
        authSection: !!authSection,
        dashboardSection: !!dashboardSection
    });

    // Null-safe style updates with logging
    try {
        if (authSection) {
            authSection.style.display = user ? 'none' : 'block';
            console.log('Auth Section Display:', authSection.style.display);
        } else {
            console.warn('Auth section element not found');
        }

        if (dashboardSection) {
            dashboardSection.style.display = user ? 'block' : 'none';
            console.log('Dashboard Section Display:', dashboardSection.style.display);
        } else {
            console.warn('Dashboard section element not found');
        }
    } catch (styleError) {
        console.error('Error updating element styles:', styleError);
    }

    if (user) {
        // Fetch user details with error handling
        firebase.firestore().collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    console.log('User Data:', userData);
                    
                    // Update welcome message safely
                    const userWelcomeElement = document.getElementById('user-welcome');
                    if (userWelcomeElement) {
                        userWelcomeElement.textContent = userData.name || user.email;
                        console.log('Welcome message updated');
                    } else {
                        console.warn('User welcome element not found');
                    }
                } else {
                    console.warn('User document not found');
                }
            })
            .catch((error) => {
                console.error('Error fetching user data:', {
                    message: error.message,
                    code: error.code
                });
            })
            .finally(() => {
                console.groupEnd();
            });
    } else {
        console.groupEnd();
    }
});