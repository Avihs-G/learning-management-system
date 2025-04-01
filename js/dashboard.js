// Dashboard Content Management
function loadDashboardContent(section) {
    // Get current user role
    const role = localStorage.getItem('userRole') || 'student';
    
    // Get role content element
    const roleContent = document.getElementById('role-content');
    
    // Clear previous content
    roleContent.innerHTML = '';

    // Determine which content to load based on section and role
    switch(section) {
        case 'dashboard':
            loadMainDashboard(role);
            break;
        case 'books':
            loadBookSection(role);
            break;
        case 'documents':
            loadDocumentSection(role);
            break;
        case 'users':
            if (role === 'admin') {
                loadUserSection(role);
            } else {
                // Show access denied message for non-admin users
                roleContent.innerHTML = `
                    <div class="container-fluid">
                        <div class="alert alert-danger">
                            You do not have permission to access this section.
                        </div>
                    </div>
                `;
            }
            break;
        case 'return-requests':
            if (role === 'admin' || role === 'teacher') {
                viewReturnRequests();
            } else {
                // Show access denied message for students
                roleContent.innerHTML = `
                    <div class="container-fluid">
                        <div class="alert alert-danger">
                            You do not have permission to access this section.
                        </div>
                    </div>
                `;
            }
            break;
        default:
            loadMainDashboard(role);
    }
}

// Main Dashboard Overview
function loadMainDashboard(role) {
    const roleContent = document.getElementById('role-content');
    roleContent.innerHTML = `
        <div class="container-fluid">
            <h2 class="mb-4">${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</h2>
            
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="fas fa-book fa-3x text-primary mb-3"></i>
                            <h5 class="card-title">Total Books</h5>
                            <p class="card-text" id="total-books">Loading...</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="fas fa-book-open fa-3x text-success mb-3"></i>
                            <h5 class="card-title">Available Books</h5>
                            <p class="card-text" id="available-books">Loading...</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <i class="fas fa-book-reader fa-3x text-warning mb-3"></i>
                            <h5 class="card-title">Borrowed Books</h5>
                            <p class="card-text" id="borrowed-books">Loading...</p>
                        </div>
                    </div>
                </div>
            </div>

            ${role === 'admin' ? `
            <div class="row mt-3">
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Recent Activities</h5>
                            <ul class="list-group" id="recent-activities">
                                <!-- Recent activities will be loaded here -->
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">System Overview</h5>
                            <div id="system-overview">
                                <!-- System overview will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Load dashboard statistics
    loadDashboardStatistics(role);
}

// Load Dashboard Statistics
function loadDashboardStatistics(role) {
    // Total Books
    firebase.firestore().collection('books').get()
        .then((bookSnapshot) => {
            document.getElementById('total-books').textContent = bookSnapshot.size;
        });

    // Available Books
    firebase.firestore().collection('books')
        .where('status', '==', 'Available')
        .get()
        .then((availableSnapshot) => {
            document.getElementById('available-books').textContent = availableSnapshot.size;
        });

    // Borrowed Books
    firebase.firestore().collection('books')
        .where('status', '==', 'Borrowed')
        .get()
        .then((borrowedSnapshot) => {
            document.getElementById('borrowed-books').textContent = borrowedSnapshot.size;
        });

    // Additional role-specific statistics can be added here
    if (role === 'admin') {
        loadRecentActivities();
        loadSystemOverview();
    }
}

// Additional helper functions for admin dashboard
function loadRecentActivities() {
    const recentActivitiesList = document.getElementById('recent-activities');
    
    firebase.firestore().collection('activities')
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get()
        .then((querySnapshot) => {
            recentActivitiesList.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const activity = doc.data();
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item';
                listItem.textContent = `${activity.description} - ${new Date(activity.timestamp.toDate()).toLocaleString()}`;
                recentActivitiesList.appendChild(listItem);
            });
        })
        .catch((error) => {
            console.error('Error loading recent activities:', error);
            recentActivitiesList.innerHTML = '<li class="list-group-item">Unable to load activities</li>';
        });
}

function loadSystemOverview() {
    const systemOverview = document.getElementById('system-overview');
    
    Promise.all([
        firebase.firestore().collection('books').where('status', '==', 'Available').get(),
        firebase.firestore().collection('books').where('status', '==', 'Borrowed').get(),
        firebase.firestore().collection('users').where('role', '==', 'student').get(),
        firebase.firestore().collection('users').where('role', '==', 'teacher').get()
    ])
    .then(([availableBooks, borrowedBooks, students, teachers]) => {
        systemOverview.innerHTML = `
            <p><strong>Available Books:</strong> ${availableBooks.size}</p>
            <p><strong>Borrowed Books:</strong> ${borrowedBooks.size}</p>
            <p><strong>Total Students:</strong> ${students.size}</p>
            <p><strong>Total Teachers:</strong> ${teachers.size}</p>
        `;
    })
    .catch((error) => {
        console.error('Error loading system overview:', error);
        systemOverview.innerHTML = 'Unable to load system overview';
    });
}

// Book Section Management
function loadBookSection(role) {
    const roleContent = document.getElementById('role-content');
    roleContent.innerHTML = `
        <div class="container-fluid">
            <h2 class="mb-4">Book Management</h2>
            
            ${role === 'admin' || role === 'teacher' ? `
            <div class="mb-3">
                <button class="btn btn-primary" onclick="openAddBookModal()">
                    <i class="fas fa-plus me-2"></i>Add New Book
                </button>
            </div>
            ` : ''}
            
            <div class="row mb-3">
                <div class="col-md-4">
                    <select id="book-category-filter" class="form-control" onchange="filterBooks()">
                        <option value="">All Categories</option>
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Science">Science</option>
                        <option value="Technology">Technology</option>
                        <option value="History">History</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <select id="book-status-filter" class="form-control" onchange="filterBooks()">
                        <option value="">All Status</option>
                        <option value="available">Available</option>
                        <option value="borrowed">Borrowed</option>
                        <option value="damaged">Damaged</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <input type="text" id="book-search" class="form-control" placeholder="Search Books" onkeyup="filterBooks()">
                </div>
            </div>
            
            <div id="book-list-container">
                <!-- Book list will be dynamically loaded -->
            </div>
        </div>
    `;
    
    // Load book list for all roles
    loadBookList(role);
}

// Load Book List
function loadBookList(role) {
    const bookListContainer = document.getElementById('book-list-container');
    bookListContainer.innerHTML = 'Loading books...';

    // Get current user
    const currentUser = firebase.auth().currentUser;

    firebase.firestore().collection('books').get()
        .then((querySnapshot) => {
            let tableHTML = `
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Category</th>
                            <th>ISBN</th>
                            <th>Total Copies</th>
                            <th>Available Copies</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            querySnapshot.forEach((doc) => {
                const book = doc.data();
                const bookId = doc.id;
                
                // Calculate book statistics
                const totalCopies = book.totalCopies || 0;
                const borrowedHistory = book.borrowedHistory || [];
                
                // Count active borrowed copies (without return date)
                const activeBorrowedCopies = borrowedHistory.filter(entry => !entry.returnDate).length;
                const availableCopies = totalCopies - activeBorrowedCopies;

                // Check if current user has borrowed this book
                let isCurrentUserBorrowed = false;
                if (currentUser && borrowedHistory) {
                    isCurrentUserBorrowed = borrowedHistory.some(
                        entry => entry.borrowerId === currentUser.uid && !entry.returnDate
                    );
                }

                // Determine action buttons based on role
                let actionButtons = '';
                if (role === 'student' && currentUser) {
                    if (isCurrentUserBorrowed) {
                        // Student has borrowed this book
                        actionButtons = `
                            <button class="btn btn-sm btn-warning" onclick="returnBook('${bookId}')">
                                <i class="fas fa-undo"></i> Return Book
                            </button>
                        `;
                    } else if (availableCopies > 0) {
                        // Book is available for borrowing
                        actionButtons = `
                            <button class="btn btn-sm btn-success" onclick="borrowBook('${bookId}')">
                                <i class="fas fa-book"></i> Borrow
                            </button>
                        `;
                    }
                } else if (role === 'admin' || role === 'teacher') {
                    actionButtons = `
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-warning" onclick="editBook('${bookId}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteBook('${bookId}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                            <button class="btn btn-sm btn-info" onclick="assignBook('${bookId}')">
                                <i class="fas fa-user-plus"></i> Assign Book
                            </button>
                            <button class="btn btn-sm btn-success" onclick="viewBorrowedBooks('${bookId}')">
                                <i class="fas fa-book-reader"></i> Borrowed Books
                            </button>
                        </div>
                    `;
                }

                tableHTML += `
                    <tr>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.category || 'N/A'}</td>
                        <td>${book.isbn}</td>
                        <td>${totalCopies}</td>
                        <td>${availableCopies}</td>
                        <td>${availableCopies > 0 ? 'Available' : 'Fully Borrowed'}</td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-info" onclick="viewBookDetails('${bookId}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                ${actionButtons}
                            </div>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            bookListContainer.innerHTML = tableHTML;
        })
        .catch((error) => {
            console.error('Error loading books:', error);
            bookListContainer.innerHTML = 'Failed to load books';
        });
}

function assignBook(bookId) {
    // Open a modal to assign book to a student
    const modalHTML = `
        <div class="modal fade" id="assignBookModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Assign Book</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Select Student</label>
                            <select id="student-select" class="form-control">
                                <!-- Students will be dynamically loaded here -->
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Assign Date</label>
                            <input type="date" id="assign-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Due Date</label>
                            <input type="date" id="due-date" class="form-control">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="confirmBookAssignment('${bookId}')">Assign Book</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Load students
    loadStudentsForAssignment();

    // Show modal
    const modalElement = document.getElementById('assignBookModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function loadStudentsForAssignment() {
    const studentSelect = document.getElementById('student-select');
    
    // Fetch students from Firestore
    firebase.firestore().collection('users')
        .where('role', '==', 'student')
        .get()
        .then((querySnapshot) => {
            studentSelect.innerHTML = '<option value="">Select a student</option>';
            
            // Check if any students exist
            if (querySnapshot.empty) {
                studentSelect.innerHTML = '<option>No students found</option>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const student = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${student.name || 'Unknown'} (${student.email})`;
                studentSelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error loading students:', error);
            studentSelect.innerHTML = '<option>Failed to load students</option>';
        });
}
function confirmBookAssignment(bookId) {
    const studentSelect = document.getElementById('student-select');
    const studentId = studentSelect.value;
    const assignDate = document.getElementById('assign-date').value;
    const dueDate = document.getElementById('due-date').value;

    // Enhanced validation
    if (!studentId) {
        alert('Please select a student');
        studentSelect.focus();
        return;
    }

    if (!assignDate) {
        alert('Please select an assign date');
        return;
    }

    if (!dueDate) {
        alert('Please select a due date');
        return;
    }

    // Declare student variable in outer scope
    let student, book;

    // Fetch student and book details
    firebase.firestore().collection('users').doc(studentId).get()
    .then((studentDoc) => {
        if (!studentDoc.exists) {
            throw new Error('Student not found');
        }
        student = studentDoc.data();

        // Fetch book details
        return firebase.firestore().collection('books').doc(bookId).get();
    })
    .then((bookDoc) => {
        if (!bookDoc.exists) {
            throw new Error('Book not found');
        }
        book = bookDoc.data();

        // Calculate available copies
        const totalCopies = book.totalCopies || 0;
        const borrowedCopies = book.borrowedHistory 
            ? book.borrowedHistory.filter(entry => !entry.returnDate).length 
            : 0;
        const availableCopies = totalCopies - borrowedCopies;

        // Check book availability
        if (availableCopies <= 0) {
            throw new Error('No copies of this book are available');
        }

        // Update book document
        return firebase.firestore().collection('books').doc(bookId).update({
            borrowedHistory: firebase.firestore.FieldValue.arrayUnion({
                borrowerId: studentId,
                borrowerEmail: student.email,
                borrowedDate: firebase.firestore.Timestamp.fromDate(new Date(assignDate)),
                dueDate: firebase.firestore.Timestamp.fromDate(new Date(dueDate)),
                returnDate: null
            })
        });
    })
    .then(() => {
        // Create a borrowing record
        return firebase.firestore().collection('borrowings').add({
            bookId: bookId,
            userId: studentId,
            userEmail: student.email,
            borrowedDate: firebase.firestore.FieldValue.serverTimestamp(),
            dueDate: firebase.firestore.Timestamp.fromDate(new Date(dueDate)),
            returnDate: null,
            status: 'Borrowed'
        });
    })
    .then(() => {
        alert('Book assigned successfully!');
        // Close the modal
        const modalElement = document.getElementById('assignBookModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        // Reload book list
        loadBookList(localStorage.getItem('userRole'));
    })
    .catch((error) => {
        console.error('Error assigning book:', error);
        alert('Failed to assign book: ' + error.message);
    });
}

// New function to view book details
function viewBookDetails(bookId) {
    firebase.firestore().collection('books').doc(bookId).get()
        .then((doc) => {
            if (doc.exists) {
                const book = doc.data();
                const modalHTML = `
                    <div class="modal fade" id="bookDetailsModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Book Details</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h4>${book.title}</h4>
                                            <p><strong>Author:</strong> ${book.author}</p>
                                            <p><strong>ISBN:</strong> ${book.isbn}</p>
                                            <p><strong>Category:</strong> ${book.category || 'N/A'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Publication Year:</strong> ${book.publicationYear || 'N/A'}</p>
                                            <p><strong>Total Copies:</strong> ${book.totalCopies}</p>
                                            <p><strong>Available Copies:</strong> ${book.availableCopies}</p>
                                            <p><strong>Status:</strong> ${book.status}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="row mt-3">
                                        <div class="col-md-6">
                                            <p><strong>Shelf Location:</strong> ${book.shelfLocation || 'N/A'}</p>
                                            <p><strong>Publisher:</strong> ${book.publisher || 'N/A'}</p>
                                            <p><strong>Edition:</strong> ${book.edition || 'N/A'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Keywords:</strong> ${book.keywords ? book.keywords.join(', ') : 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    ${book.description ? `
                                    <div class="row mt-3">
                                        <div class="col-12">
                                            <h5>Description</h5>
                                            <p>${book.description}</p>
                                        </div>
                                    </div>
                                    ` : ''}
                                    
                                    <div class="row mt-3">
                                        <div class="col-12">
                                            <h5>Borrowing History</h5>
                                            <table class="table">
                                                <thead>
                                                    <tr>
                                                        <th>Borrower</th>
                                                        <th>Borrowed Date</th>
                                                        <th>Return Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${book.borrowedHistory && book.borrowedHistory.length > 0 ? 
                                                        book.borrowedHistory.map(history => `
                                                        <tr>
                                                            <td>${history.borrowerEmail || 'N/A'}</td>
                                                            <td>${history.borrowedDate ? new Date(history.borrowedDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                                                            <td>${history.returnDate ? new Date(history.returnDate.toDate()).toLocaleDateString() : 'Not Returned'}</td>
                                                        </tr>
                                                    `).join('') : 
                                                    '<tr><td colspan="3">No borrowing history</td></tr>'}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Create modal
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHTML;
                document.body.appendChild(modalContainer);
                
                // Show modal using Bootstrap
                const modalElement = document.getElementById('bookDetailsModal');
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        })
        .catch((error) => {
            console.error('Error fetching book details:', error);
            alert('Failed to fetch book details');
        });
}

// Update addNewBook function to include description

function addNewBook() {
    // Collect all form values
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const isbn = document.getElementById('book-isbn').value;
    const category = document.getElementById('book-category').value;
    const totalCopies = document.getElementById('book-total-copies').value;
    const publicationYear = document.getElementById('book-publication-year').value;
    const description = document.getElementById('book-description').value;
    const status = document.getElementById('book-status').value;
    const shelfLocation = document.getElementById('book-shelf-location').value;
    const publisher = document.getElementById('book-publisher').value;
    const edition = document.getElementById('book-edition').value;
    const keywords = document.getElementById('book-keywords').value;

    // Validation
    if (!title || !author || !isbn || !category || !totalCopies) {
        alert('Please fill in all required fields');
        return;
    }

    // Prepare book data object with all new fields
    const bookData = {
        title: title,
        author: author,
        isbn: isbn,
        category: category,
        totalCopies: parseInt(totalCopies),
        availableCopies: parseInt(totalCopies),
        publicationYear: publicationYear || null,
        description: description || '',
        status: status || 'Available',
        shelfLocation: shelfLocation || '',
        publisher: publisher || '',
        edition: edition || '',
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        borrowedHistory: [] // Track borrowing history
    };

    // Add book to Firestore
    firebase.firestore().collection('books').add(bookData)
    .then((docRef) => {
        alert('Book added successfully');
        // Close the modal
        const modalElement = document.getElementById('addBookModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        // Reload book list
        loadBookList(localStorage.getItem('userRole'));
    })
    .catch((error) => {
        console.error('Error adding book:', error);
        alert('Failed to add book');
    });
}
function openAddBookModal() {
    const modalHTML = `
        <div class="modal fade" id="addBookModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Book</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Book Title</label>
                                <input type="text" id="book-title" class="form-control" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Author</label>
                                <input type="text" id="book-author" class="form-control" required>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">ISBN</label>
                                <input type="text" id="book-isbn" class="form-control" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Category</label>
                                <select id="book-category" class="form-control">
                                    <option value="">Select Category</option>
                                    <option value="Fiction">Fiction</option>
                                    <option value="Non-Fiction">Non-Fiction</option>
                                    <option value="Science">Science</option>
                                    <option value="Technology">Technology</option>
                                    <option value="History">History</option>
                                    <option value="Literature">Literature</option>
                                    <option value="Biography">Biography</option>
                                    <option value="Self-Help">Self-Help</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Total Copies</label>
                                <input type="number" id="book-total-copies" class="form-control" min="1" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Publication Year</label>
                                <input type="number" id="book-publication-year" class="form-control" min="1800" max="2023">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Book Status</label>
                                <select id="book-status" class="form-control">
                                    <option value="Available">Available</option>
                                    <option value="Borrowed">Borrowed</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Lost">Lost</option>
                                    <option value="Under Repair">Under Repair</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Shelf Location</label>
                                <input type="text" id="book-shelf-location" class="form-control" placeholder="e.g., A1, B2">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Book Description</label>
                            <textarea id="book-description" class="form-control" rows="3" placeholder="Enter book description"></textarea>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Publisher</label>
                                <input type="text" id="book-publisher" class="form-control">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Edition</label>
                                <input type="text" id="book-edition" class="form-control" placeholder="e.g., 1st, 2nd">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Keywords</label>
                            <input type="text" id="book-keywords" class="form-control" placeholder="Enter keywords separated by commas">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="addNewBook()">Add Book</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Show modal using Bootstrap
    const modalElement = document.getElementById('addBookModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}
// Add New Book
function addNewBook() {
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const isbn = document.getElementById('book-isbn').value;
    const category = document.getElementById('book-category').value;
    const totalCopies = document.getElementById('book-total-copies').value;
    const publicationYear = document.getElementById('book-publication-year').value;
    const description = document.getElementById('book-description').value;

    // Validation
    if (!title || !author || !isbn || !category || !totalCopies) {
        alert('Please fill in all required fields');
        return;
    }

    firebase.firestore().collection('books').add({
        title: title,
        author: author,
        isbn: isbn,
        category: category,
        totalCopies: parseInt(totalCopies),
        availableCopies: parseInt(totalCopies),
        publicationYear: publicationYear || null,
        description: description || '',
        status: 'Available',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        borrowedHistory: [] // Track borrowing history
    })
    .then((docRef) => {
        alert('Book added successfully');
        // Close the modal
        const modalElement = document.getElementById('addBookModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        // Reload book list
        loadBookList(localStorage.getItem('userRole'));
    })
    .catch((error) => {
        console.error('Error adding book:', error);
        alert('Failed to add book');
    });
}

// Edit Book
function editBook(bookId) {
    // Fetch book details
    firebase.firestore().collection('books').doc(bookId).get()
        .then((doc) => {
            if (doc.exists) {
                const book = doc.data();
                const modalHTML = `
                    <div class="modal fade" id="editBookModal" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Edit Book</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Book Title</label>
                                            <input type="text" id="edit-book-title" class="form-control" value="${book.title}" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Author</label>
                                            <input type="text" id="edit-book-author" class="form-control" value="${book.author}" required>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">ISBN</label>
                                            <input type="text" id="edit-book-isbn" class="form-control" value="${book.isbn}" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Category</label>
                                            <select id="edit-book-category" class="form-control">
                                                <option value="Fiction" ${book.category === 'Fiction' ? 'selected' : ''}>Fiction</option>
                                                <option value="Non-Fiction" ${book.category === 'Non-Fiction' ? 'selected' : ''}>Non-Fiction</option>
                                                <option value="Science" ${book.category === 'Science' ? 'selected' : ''}>Science</option>
                                                <option value="Technology" ${book.category === 'Technology' ? 'selected' : ''}>Technology</option>
                                                <option value="History" ${book.category === 'History' ? 'selected' : ''}>History</option>
                                                <option value="Literature" ${book.category === 'Literature' ? 'selected' : ''}>Literature</option>
                                                <option value="Biography" ${book.category === 'Biography' ? 'selected' : ''}>Biography</option>
                                                <option value="Self-Help" ${book.category === 'Self-Help' ? 'selected' : ''}>Self-Help</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Total Copies</label>
                                            <input type="number" id="edit-book-total-copies" class="form-control" value="${book.totalCopies}" min="1" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Publication Year</label>
                                            <input type="number" id="edit-book-publication-year" class="form-control" value="${book.publicationYear || ''}" min="1800" max="2023">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Book Status</label>
                                            <select id="edit-book-status" class="form-control">
                                                <option value="Available" ${book.status === 'Available' ? 'selected' : ''}>Available</option>
                                                <option value="Borrowed" ${book.status === 'Borrowed' ? 'selected' : ''}>Borrowed</option>
                                                <option value="Damaged" ${book.status === 'Damaged' ? 'selected' : ''}>Damaged</option>
                                                <option value="Lost" ${book.status === 'Lost' ? 'selected' : ''}>Lost</option>
                                                <option value="Under Repair" ${book.status === 'Under Repair' ? 'selected' : ''}>Under Repair</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Shelf Location</label>
                                            <input type="text" id="edit-book-shelf-location" class="form-control" value="${book.shelfLocation || ''}" placeholder="e.g., A1, B2">
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Book Description</label>
                                        <textarea id="edit-book-description" class="form-control" rows="3">${book.description || ''}</textarea>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Publisher</label>
                                            <input type="text" id="edit-book-publisher" class="form-control" value="${book.publisher || ''}">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Edition</label>
                                            <input type="text" id="edit-book-edition" class="form-control" value="${book.edition || ''}" placeholder="e.g., 1st, 2nd">
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Keywords</label>
                                        <input type="text" id="edit-book-keywords" class="form-control" value="${book.keywords ? book.keywords.join(', ') : ''}" placeholder="Enter keywords separated by commas">
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-primary" onclick="updateBook('${bookId}')">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Create modal
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHTML;
                document.body.appendChild(modalContainer);
                
                // Show modal using Bootstrap
                const modalElement = document.getElementById('editBookModal');
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        })
        .catch((error) => {
            console.error('Error fetching book details:', error);
            alert('Failed to fetch book details');
        });
}

// Update Book
function updateBook(bookId) {
    // Collect all form values
    const title = document.getElementById('edit-book-title').value;
    const author = document.getElementById('edit-book-author').value;
    const isbn = document.getElementById('edit-book-isbn').value;
    const category = document.getElementById('edit-book-category').value;
    const totalCopies = document.getElementById('edit-book-total-copies').value;
    const publicationYear = document.getElementById('edit-book-publication-year').value;
    const description = document.getElementById('edit-book-description').value;
    const status = document.getElementById('edit-book-status').value;
    const shelfLocation = document.getElementById('edit-book-shelf-location').value;
    const publisher = document.getElementById('edit-book-publisher').value;
    const edition = document.getElementById('edit-book-edition').value;
    const keywords = document.getElementById('edit-book-keywords').value;

    // Validation
    if (!title || !author || !isbn || !category || !totalCopies) {
        alert('Please fill in all required fields');
        return;
    }

    // Prepare book data object with all new fields
    const bookData = {
        title: title,
        author: author,
        isbn: isbn,
        category: category,
        totalCopies: parseInt(totalCopies),
        publicationYear: publicationYear || null,
        description: description || '',
        status: status || 'Available',
        shelfLocation: shelfLocation || '',
        publisher: publisher || '',
        edition: edition || '',
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Update book in Firestore
    firebase.firestore().collection('books').doc(bookId).update(bookData)
    .then(() => {
        alert('Book updated successfully');
        // Close the modal
        const modalElement = document.getElementById('editBookModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        // Reload book list
        loadBookList(localStorage.getItem('userRole'));
    })
    .catch((error) => {
        console.error('Error updating book:', error);
        alert('Failed to update book');
    });
}

// Delete Book
function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        firebase.firestore().collection('books').doc(bookId).delete()
            .then(() => {
                alert('Book deleted successfully');
                loadBookList(localStorage.getItem('userRole'));
            })
            .catch((error) => {
                console.error('Error deleting book:', error);
                alert('Failed to delete book');
            });
    }
}

// Document Section Management
function loadDocumentSection(role) {
    const roleContent = document.getElementById('role-content');
    roleContent.innerHTML = `
        <div class="container-fluid">
            <h2 class="mb-4">Document Management</h2>
            
            ${role === 'admin' || role === 'teacher' ? `
            <div class="mb-3">
                <button class="btn btn-primary" onclick="openAddDocumentModal()">
                    <i class="fas fa-plus me-2"></i>Add New Document
                </button>
            </div>
            ` : ''}
            
            <div id="document-list-container">
                <!-- Document list will be dynamically loaded -->
            </div>
        </div>
    `;
    
    // Load document list for all roles
    loadDocumentList(role);
}

// Load Document List
function loadDocumentList(role) {
    const documentListContainer = document.getElementById('document-list-container');
    documentListContainer.innerHTML = 'Loading documents...';

    firebase.firestore().collection('documents').get()
        .then((querySnapshot) => {
            let tableHTML = `
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>File Name</th>
                            <th>Upload Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            querySnapshot.forEach((doc) => {
                const document = doc.data();
                const documentId = doc.id;
                tableHTML += `
                    <tr>
                        <td>${document.title}</td>
                        <td>${document.fileName}</td>
                        <td>${document.uploadedAt ? new Date(document.uploadedAt.toDate()).toLocaleDateString() : 'Unknown'}</td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-success" onclick="viewDocument('${documentId}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="downloadDocument('${documentId}')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                                ${role === 'admin' || role === 'teacher' ? `
                                    <button class="btn btn-sm btn-warning" onclick="editDocument('${documentId}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteDocument('${documentId}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            documentListContainer.innerHTML = tableHTML;
        })
        .catch((error) => {
            console.error('Error loading documents:', error);
            documentListContainer.innerHTML = 'Failed to load documents';
        });
}

// View Document Details
function viewDocument(documentId) {
    firebase.firestore().collection('documents').doc(documentId).get()
        .then((doc) => {
            if (doc.exists) {
                const document = doc.data();
                const modalHTML = `
                    <div class="modal fade" id="documentDetailsModal" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Document Details</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <strong>Title:</strong> ${document.title}
                                        </div>
                                        <div class="col-md-6">
                                            <strong>File Name:</strong> ${document.fileName}
                                        </div>
                                    </div>
                                    <div class="row mt-3">
                                        <div class="col-md-6">
                                            <strong>Upload Date:</strong> ${document.uploadedAt ? new Date(document.uploadedAt.toDate()).toLocaleString() : 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-primary" onclick="downloadDocument('${documentId}')">Download</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Create modal
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHTML;
                document.body.appendChild(modalContainer);
                
                // Show modal using Bootstrap
                const modalElement = document.getElementById('documentDetailsModal');
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        })
        .catch((error) => {
            console.error('Error fetching document details:', error);
            alert('Failed to fetch document details');
        });
}

// Download Document
function downloadDocument(documentId) {
    firebase.firestore().collection('documents').doc(documentId).get()
        .then((doc) => {
            if (doc.exists) {
                const document = doc.data();
                
                // Create a temporary link element to trigger download
                const link = document.createElement('a');
                link.href = document.fileContent;
                link.download = document.fileName;
                link.click();
            }
        })
        .catch((error) => {
            console.error('Error downloading document:', error);
            alert('Failed to download document');
        });
}

// Open Add Document Modal
function openAddDocumentModal() {
    const modalHTML = `
        <div class="modal fade" id="addDocumentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Document</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="text" id="document-title" class="form-control mb-2" placeholder="Document Title" required>
                        <input type="file" id="document-file" class="form-control mb-2" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="uploadDocument()">Upload Document</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Create modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Show modal using Bootstrap
    const modalElement = document.getElementById('addDocumentModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

// Upload Document
function uploadDocument() {
    const title = document.getElementById('document-title').value;
    const fileInput = document.getElementById('document-file');

    if (!title || !fileInput.files.length) {
        alert('Please fill in all fields and select a file');
        return;
    }

    const file = fileInput.files[0];
    
    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {
        const base64data = reader.result;

        // Save document metadata and base64 content to Firestore
        firebase.firestore().collection('documents').add({
            title: title,
            fileName: file.name,
            fileContent: base64data,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert('Document uploaded successfully');
            // Close the modal
            const modalElement = document.getElementById('addDocumentModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();
            
            // Reload document list
            loadDocumentList(localStorage.getItem('userRole'));
        })
        .catch((error) => {
            console.error('Error uploading document:', error);
            alert('Failed to upload document');
        });
    };
}

// Edit Document
function editDocument(documentId) {
    // Fetch document details
    firebase.firestore().collection('documents').doc(documentId).get()
        .then((doc) => {
            if (doc.exists) {
                const document = doc.data();
                const modalHTML = `
                    <div class="modal fade" id="editDocumentModal" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Edit Document</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <input type="text" id="edit-document-title" class="form-control mb-2" placeholder="Document Title" value="${document.title}" required>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-primary" onclick="updateDocument('${documentId}')">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Create modal
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHTML;
                document.body.appendChild(modalContainer);
                
                // Show modal using Bootstrap
                const modalElement = document.getElementById('editDocumentModal');
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        })
        .catch((error) => {
            console.error('Error fetching document details:', error);
            alert('Failed to fetch document details');
        });
}

// Update Document
function updateDocument(documentId) {
    const title = document.getElementById('edit-document-title').value;

    if (!title) {
        alert('Please fill in the title');
        return;
    }

    firebase.firestore().collection('documents').doc(documentId).update({
        title: title,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Document updated successfully');
        // Close the modal
        const modalElement = document.getElementById('editDocumentModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        // Reload document list
        loadDocumentList(localStorage.getItem('userRole'));
    })
    .catch((error) => {
        console.error('Error updating document:', error);
        alert('Failed to update document');
    });
}

// Delete Document
function deleteDocument(documentId) {
    if (confirm('Are you sure you want to delete this document?')) {
        firebase.firestore().collection('documents').doc(documentId).delete()
            .then(() => {
                alert('Document deleted successfully');
                loadDocumentList(localStorage.getItem('userRole'));
            })
            .catch((error) => {
                console.error('Error deleting document:', error);
                alert('Failed to delete document');
            });
    }
}

// User Section Management
function loadUserSection(role) {
    // Only allow admin to manage users
    const roleContent = document.getElementById('role-content');
    
    if (role !== 'admin') {
        roleContent.innerHTML = `
            <div class="container-fluid">
                <div class="alert alert-danger">
                    You do not have permission to access this section.
                </div>
            </div>
        `;
        return;
    }

    // If admin, load user management section
    if (typeof loadUserManagementSection === 'function') {
        loadUserManagementSection(role);
    } else {
        roleContent.innerHTML = `
            <div class="container-fluid">
                <div class="alert alert-warning">
                    User management script not loaded. Please refresh the page.
                </div>
            </div>
        `;
    }
}
// Borrow Book Function
function borrowBook(bookId) {
    const currentUser = firebase.auth().currentUser;
    
    if (!currentUser) {
        alert('Please log in to borrow a book');
        return;
    }

    // Calculate due date (30 days from now)
    const borrowedDate = firebase.firestore.Timestamp.now();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Fetch book details
    firebase.firestore().collection('books').doc(bookId).get()
        .then((doc) => {
            if (doc.exists) {
                const book = doc.data();
                
                // Calculate available copies
                const totalCopies = book.totalCopies || 0;
                const borrowedCopies = book.borrowedHistory 
                    ? book.borrowedHistory.filter(entry => !entry.returnDate).length 
                    : 0;
                const availableCopies = totalCopies - borrowedCopies;

                // Check if book is available
                if (availableCopies <= 0) {
                    alert('Sorry, no copies of this book are currently available');
                    return Promise.reject('No copies available');
                }

                // Check if user has already borrowed this book
                const isAlreadyBorrowed = book.borrowedHistory && book.borrowedHistory.some(
                    entry => entry.borrowerId === currentUser.uid && !entry.returnDate
                );

                if (isAlreadyBorrowed) {
                    alert('You have already borrowed this book');
                    return Promise.reject('Book already borrowed by user');
                }

                // Update book document
                return firebase.firestore().collection('books').doc(bookId).update({
                    borrowedHistory: firebase.firestore.FieldValue.arrayUnion({
                        borrowerId: currentUser.uid,
                        borrowerEmail: currentUser.email,
                        borrowedDate: borrowedDate,
                        dueDate: firebase.firestore.Timestamp.fromDate(dueDate),
                        returnDate: null
                    }),
                    availableCopies: availableCopies - 1,
                    status: availableCopies - 1 > 0 ? 'Partially Borrowed' : 'Fully Borrowed'
                });
            } else {
                throw new Error('Book not found');
            }
        })
        .then(() => {
            // Create a borrowing record
            return firebase.firestore().collection('borrowings').add({
                bookId: bookId,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                borrowedDate: firebase.firestore.FieldValue.serverTimestamp(),
                dueDate: firebase.firestore.Timestamp.fromDate(dueDate),
                returnDate: null,
                status: 'Borrowed'
            });
        })
        .then(() => {
            alert('Book borrowed successfully! Please return within 30 days.');
            // Reload book list
            loadBookList(localStorage.getItem('userRole'));
        })
        .catch((error) => {
            console.error('Error borrowing book:', error);
            alert('Failed to borrow book: ' + error.message);
        });
}

function returnBook(bookId) {
    const currentUser = firebase.auth().currentUser;
    
    if (!currentUser) {
        alert('Please log in to return a book');
        return;
    }

    // Create modal for book condition assessment
    const modalHTML = `
        <div class="modal fade" id="bookReturnModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Book Return Assessment</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group mb-3">
                            <label class="form-label">Book Condition</label>
                            <select id="book-condition" class="form-control">
                                <option value="good">Good Condition</option>
                                <option value="slight-damage">Slight Damage</option>
                                <option value="significant-damage">Significant Damage</option>
                            </select>
                        </div>
                        <div class="form-group mb-3">
                            <label class="form-label">Additional Comments</label>
                            <textarea id="return-comments" class="form-control" rows="3" placeholder="Any additional notes about the book's condition"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="submitBookReturn('${bookId}')">Submit Return Request</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Show modal
    const modalElement = document.getElementById('bookReturnModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function submitBookReturn(bookId) {
    const currentUser = firebase.auth().currentUser;
    const bookCondition = document.getElementById('book-condition').value;
    const comments = document.getElementById('return-comments').value;

    // Fetch book details
    firebase.firestore().collection('books').doc(bookId).get()
        .then((doc) => {
            if (doc.exists) {
                const book = doc.data();

                // Find the active borrowed entry for the current user
                const activeBorrowedEntry = book.borrowedHistory 
                    ? book.borrowedHistory.find(
                        entry => entry.borrowerId === currentUser.uid && !entry.returnDate
                    )
                    : null;

                if (!activeBorrowedEntry) {
                    throw new Error('No active borrowed book found');
                }

                // Create return request
                return firebase.firestore().collection('return-requests').add({
                    bookId: bookId,
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    bookTitle: book.title,
                    condition: bookCondition,
                    comments: comments,
                    status: 'pending',
                    requestDate: firebase.firestore.FieldValue.serverTimestamp(),
                    borrowedDate: activeBorrowedEntry.borrowedDate
                });
            } else {
                throw new Error('Book not found');
            }
        })
        .then(() => {
            alert('Return request submitted. Awaiting admin/teacher approval.');
            
            // Close the modal
            const modalElement = document.getElementById('bookReturnModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();
            
            // Reload book list
            loadBookList(localStorage.getItem('userRole'));
        })
        .catch((error) => {
            console.error('Error submitting return request:', error);
            alert('Failed to submit return request: ' + error.message);
        });
}

function viewBorrowedBooks(bookId) {
    // Create modal for borrowed books
    const modalHTML = `
        <div class="modal fade" id="borrowedBooksModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Borrowed Books Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="borrowed-books-list">
                            <!-- Borrowed books will be loaded here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Fetch book details
    firebase.firestore().collection('books').doc(bookId).get()
        .then((doc) => {
            if (doc.exists) {
                const book = doc.data();
                const borrowedBooksList = document.getElementById('borrowed-books-list');
                
                // Filter active borrowed entries (only entries without return date)
                const activeBorrowedBooks = book.borrowedHistory 
                    ? book.borrowedHistory.filter(entry => !entry.returnDate)
                    : [];

                if (activeBorrowedBooks.length === 0) {
                    borrowedBooksList.innerHTML = '<p>No books currently borrowed.</p>';
                } else {
                    let tableHTML = `
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Borrower Email</th>
                                    <th>Borrowed Date</th>
                                    <th>Due Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    activeBorrowedBooks.forEach((entry, index) => {
                        tableHTML += `
                            <tr>
                                <td>${entry.borrowerEmail}</td>
                                <td>${entry.borrowedDate ? new Date(entry.borrowedDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                                <td>${entry.dueDate ? new Date(entry.dueDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    <button class="btn btn-sm btn-warning" onclick="returnBookByAdmin('${bookId}', '${entry.borrowerId}')">
                                        <i class="fas fa-undo"></i> Return Book
                                    </button>
                                </td>
                            </tr>
                        `;
                    });

                    tableHTML += `
                            </tbody>
                        </table>
                    `;

                    borrowedBooksList.innerHTML = tableHTML;
                }

                // Show modal
                const modalElement = document.getElementById('borrowedBooksModal');
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        })
        .catch((error) => {
            console.error('Error fetching borrowed books:', error);
            alert('Failed to fetch borrowed books');
        });
}

function returnBookByAdmin(bookId, borrowerIdentifier) {
    console.group('Return Book Process');
    console.log('Attempting to return book:', { 
        bookId, 
        borrowerIdentifier,
        timestamp: new Date().toISOString(),
        userRole: localStorage.getItem('userRole')
    });

    // Validate inputs
    if (!bookId || !borrowerIdentifier) {
        console.error('Invalid input: Missing bookId or borrowerIdentifier');
        alert('Invalid book return parameters');
        console.groupEnd();
        return;
    }

    // Fetch book details
    firebase.firestore().collection('books').doc(bookId).get()
        .then((doc) => {
            console.log('Book Document Retrieval:', {
                exists: doc.exists,
                id: doc.id
            });

            if (!doc.exists) {
                throw new Error('Book document not found');
            }

            const book = doc.data();
            console.log('Current Book Data:', JSON.stringify(book, null, 2));

            // Detailed borrowed history logging
            console.log('Current Borrowed History:', 
                book.borrowedHistory ? 
                book.borrowedHistory.map(entry => ({
                    borrowerId: entry.borrowerId,
                    hasReturnDate: !!entry.returnDate
                })) : 
                'No borrowed history'
            );

            // Find the specific borrowed entry
            const borrowedEntryIndex = book.borrowedHistory.findIndex(
                entry => entry.borrowerId === borrowerIdentifier && !entry.returnDate
            );

            console.log('Borrowed Entry Details:', {
                index: borrowedEntryIndex,
                entry: borrowedEntryIndex !== -1 ? book.borrowedHistory[borrowedEntryIndex] : 'No matching entry'
            });

            if (borrowedEntryIndex === -1) {
                throw new Error('No active borrowed entry found for this user');
            }

            // Create updated borrowed history
            const updatedBorrowedHistory = [...book.borrowedHistory];
            updatedBorrowedHistory[borrowedEntryIndex] = {
                ...updatedBorrowedHistory[borrowedEntryIndex],
                returnDate: firebase.firestore.Timestamp.now(),
                status: 'returned'
            };

            // Calculate available copies
            const totalCopies = book.totalCopies || 0;
            const activeBorrowedCopies = updatedBorrowedHistory.filter(entry => !entry.returnDate).length;
            const availableCopies = totalCopies - activeBorrowedCopies;

            console.log('Copies Calculation:', {
                totalCopies,
                activeBorrowedCopies,
                availableCopies
            });

            // Prepare update data
            const updateData = {
                borrowedHistory: updatedBorrowedHistory,
                availableCopies: availableCopies,
                status: availableCopies > 0 ? 'Available' : 'Fully Borrowed'
            };

            console.log('Prepared Update Data:', updateData);

            // Update book document
            return firebase.firestore().collection('books').doc(bookId).update(updateData);
        })
        .then(() => {
            console.log('Book return process completed successfully');
            alert('Book returned successfully!');
            
            // Refresh views
            viewBorrowedBooks(bookId);
            loadBookList(localStorage.getItem('userRole'));
            
            console.groupEnd();
        })
        .catch((error) => {
            console.error('Comprehensive Error in Book Return:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            alert('Failed to return book: ' + error.message);
            console.groupEnd();
        });
}

function viewReturnRequests() {
    const roleContent = document.getElementById('role-content');
    const currentUser = firebase.auth().currentUser;
    const userRole = localStorage.getItem('userRole');

    // Check user permissions
    if (userRole !== 'admin' && userRole !== 'teacher') {
        roleContent.innerHTML = `
            <div class="container-fluid">
                <div class="alert alert-danger">
                    You do not have permission to view return requests.
                </div>
            </div>
        `;
        return;
    }

    // Show loading state
    roleContent.innerHTML = `
        <div class="container-fluid text-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading return requests...</p>
        </div>
    `;

    // Fetch pending return requests
    firebase.firestore().collection('return-requests')
        .where('status', '==', 'pending')
        .get()
        .then((querySnapshot) => {
            // Check if any requests exist
            if (querySnapshot.empty) {
                roleContent.innerHTML = `
                    <div class="container-fluid">
                        <div class="alert alert-info">
                            No pending return requests.
                        </div>
                    </div>
                `;
                return;
            }

            // Create table to display requests
            let tableHTML = `
                <div class="container-fluid">
                    <h2 class="mb-4">Return Requests</h2>
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Book Title</th>
                                            <th>Borrower</th>
                                            <th>Borrowed Date</th>
                                            <th>Return Condition</th>
                                            <th>Comments</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
            `;

            // Populate table with requests
            querySnapshot.forEach((doc) => {
                const request = doc.data();
                const requestId = doc.id;

                tableHTML += `
                    <tr>
                        <td>${request.bookTitle || 'N/A'}</td>
                        <td>${request.userEmail}</td>
                        <td>${request.borrowedDate ? new Date(request.borrowedDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                        <td>
                            <span class="badge ${getConditionBadgeClass(request.condition)}">
                                ${request.condition || 'N/A'}
                            </span>
                        </td>
                        <td>${request.comments || 'No comments'}</td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-success" onclick="processReturnRequest('${requestId}', 'accept')">
                                    <i class="fas fa-check"></i> Accept
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="processReturnRequest('${requestId}', 'penalty')">
                                    <i class="fas fa-dollar-sign"></i> Penalty
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="processReturnRequest('${requestId}', 'reject')">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            roleContent.innerHTML = tableHTML;
        })
        .catch((error) => {
            console.error('Error fetching return requests:', error);
            roleContent.innerHTML = `
                <div class="container-fluid">
                    <div class="alert alert-danger">
                        Failed to load return requests: ${error.message}
                    </div>
                </div>
            `;
        });
}

// Helper function to get badge class based on condition
function getConditionBadgeClass(condition) {
    switch(condition) {
        case 'good': return 'bg-success';
        case 'slight-damage': return 'bg-warning';
        case 'significant-damage': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function fetchReturnRequests() {
    const returnRequestsBody = document.getElementById('return-requests-body');
    
    // Clear previous content
    returnRequestsBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading return requests...</td></tr>';

    // Fetch pending return requests
    firebase.firestore().collection('return-requests')
        .where('status', '==', 'pending')
        .get()
        .then((querySnapshot) => {
            // Clear loading message
            returnRequestsBody.innerHTML = '';

            if (querySnapshot.empty) {
                returnRequestsBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            No pending return requests.
                        </td>
                    </tr>
                `;
                return;
            }

            // Populate table with return requests
            querySnapshot.forEach((doc) => {
                const request = doc.data();
                const requestId = doc.id;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${request.bookTitle || 'N/A'}</td>
                    <td>${request.userEmail}</td>
                    <td>${request.borrowedDate ? new Date(request.borrowedDate.toDate()).toLocaleDateString() : 'N/A'}</td>
                    <td>${request.condition}</td>
                    <td>${request.comments || 'No comments'}</td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-success" onclick="processReturnRequest('${requestId}', 'accept')">
                                <i class="fas fa-check"></i> Accept
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="processReturnRequest('${requestId}', 'penalty')">
                                <i class="fas fa-dollar-sign"></i> Accept with Penalty
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="processReturnRequest('${requestId}', 'reject')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </td>
                `;

                returnRequestsBody.appendChild(row);
            });
        })
        .catch((error) => {
            console.error('Error fetching return requests:', error);
            returnRequestsBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Failed to load return requests: ${error.message}
                    </td>
                </tr>
            `;
        });
}

function getConditionBadgeClass(condition) {
    const conditionClasses = {
        'good': 'bg-success',
        'slight-damage': 'bg-warning',
        'significant-damage': 'bg-danger',
        'minor-damage': 'bg-warning',
        'major-damage': 'bg-danger',
        'book-lost': 'bg-dark'
    };
    return conditionClasses[condition] || 'bg-secondary';
}

function assessBookCondition(requestId, bookId, userId, studentCondition, studentComments) {
    // Create modal for book condition assessment
    const modalHTML = `
        <div class="modal fade" id="bookConditionAssessmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Book Condition Assessment</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="card mb-3">
                            <div class="card-header">
                                Student Reported Condition
                            </div>
                            <div class="card-body">
                                <p>
                                    <strong>Condition:</strong> 
                                    <span class="badge ${getConditionBadgeClass(studentCondition)}">
                                        ${getConditionLabel(studentCondition)}
                                    </span>
                                </p>
                                <p><strong>Comments:</strong> ${studentComments || 'No comments'}</p>
                            </div>
                        </div>
                        <div class="form-group mb-3">
                            <label class="form-label">Admin Condition Assessment</label>
                            <select id="admin-book-condition" class="form-control">
                                <option value="good">Good Condition (No Penalty)</option>
                                <option value="minor-damage">Minor Damage (Small Penalty)</option>
                                <option value="major-damage">Major Damage (Significant Penalty)</option>
                                <option value="book-lost">Book Lost (Full Replacement Cost)</option>
                            </select>
                        </div>
                        <div class="form-group mb-3">
                            <label class="form-label">Detailed Assessment</label>
                            <textarea id="admin-condition-comments" class="form-control" rows="3" placeholder="Provide details about the book's condition"></textarea>
                        </div>
                        <div id="penalty-display" class="alert alert-info mt-3">
                            <!-- Penalty information will be dynamically updated -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="finalizeBookReturn('${requestId}', '${bookId}', '${userId}', '${studentCondition}')">Finalize Return</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Show modal
    const modalElement = document.getElementById('bookConditionAssessmentModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Add event listener for dynamic penalty calculation
    document.getElementById('admin-book-condition').addEventListener('change', calculatePenalty);
}

function assessBookCondition(requestId, bookId, userId) {
    // Create modal for book condition assessment
    const modalHTML = `
        <div class="modal fade" id="bookConditionAssessmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Book Condition Assessment</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group mb-3">
                            <label class="form-label">Book Condition Assessment</label>
                            <select id="admin-book-condition" class="form-control">
                                <option value="good">Good Condition (No Penalty)</option>
                                <option value="minor-damage">Minor Damage (Small Penalty)</option>
                                <option value="major-damage">Major Damage (Significant Penalty)</option>
                                <option value="book-lost">Book Lost (Full Replacement Cost)</option>
                            </select>
                        </div>
                        <div class="form-group mb-3">
                            <label class="form-label">Detailed Assessment</label>
                            <textarea id="admin-condition-comments" class="form-control" rows="3" placeholder="Provide details about the book's condition"></textarea>
                        </div>
                        <div id="penalty-display" class="alert alert-info mt-3">
                            <!-- Penalty information will be dynamically updated -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="finalizeBookReturn('${requestId}', '${bookId}', '${userId}')">Finalize Return</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Show modal
    const modalElement = document.getElementById('bookConditionAssessmentModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Add event listener for dynamic penalty calculation
    document.getElementById('admin-book-condition').addEventListener('change', calculatePenalty);
}

function calculatePenalty() {
    const conditionSelect = document.getElementById('admin-book-condition');
    const penaltyDisplay = document.getElementById('penalty-display');
    const condition = conditionSelect.value;

    let penaltyAmount = 0;
    let penaltyMessage = '';

    switch(condition) {
        case 'good':
            penaltyAmount = 0;
            penaltyMessage = 'No penalty. Book is in good condition.';
            break;
        case 'minor-damage':
            penaltyAmount = 100;
            penaltyMessage = 'Minor damage penalty: Rs. 100';
            break;
        case 'major-damage':
            penaltyAmount = 500;
            penaltyMessage = 'Major damage penalty: Rs. 500';
            break;
        case 'book-lost':
            penaltyAmount = 1500;
            penaltyMessage = 'Book lost. Full replacement cost: Rs. 1500';
            break;
    }

    penaltyDisplay.innerHTML = `
        <strong>Penalty Assessment:</strong> ${penaltyMessage}
    `;
}

function finalizeBookReturn(requestId, bookId, userId) {
    const condition = document.getElementById('admin-book-condition').value;
    const comments = document.getElementById('admin-condition-comments').value;

    let penaltyAmount = 0;
    switch(condition) {
        case 'minor-damage':
            penaltyAmount = 100;
            break;
        case 'major-damage':
            penaltyAmount = 500;
            break;
        case 'book-lost':
            penaltyAmount = 1500;
            break;
    }

    // Fetch book details
    firebase.firestore().collection('books').doc(bookId).get()
        .then((doc) => {
            if (doc.exists) {
                const book = doc.data();
                
                // Update borrowed history
                const updatedBorrowedHistory = book.borrowedHistory.map(entry => {
                    if (entry.borrowerId === userId && !entry.returnDate) {
                        return {
                            ...entry,
                            returnDate: firebase.firestore.Timestamp.now(),
                            adminCondition: condition,
                            adminComments: comments,
                            penaltyAmount: penaltyAmount
                        };
                    }
                    return entry;
                });

                // Calculate available copies
                const totalCopies = book.totalCopies || 0;
                const activeBorrowedCopies = updatedBorrowedHistory.filter(entry => !entry.returnDate).length;
                const availableCopies = totalCopies - activeBorrowedCopies;

                // Update book document
                return firebase.firestore().collection('books').doc(bookId).update({
                    borrowedHistory: updatedBorrowedHistory,
                    availableCopies: availableCopies,
                    status: availableCopies > 0 ? 'Available' : 'Fully Borrowed'
                });
            } else {
                throw new Error('Book not found');
            }
        })
        .then(() => {
            // Update return request status
            return firebase.firestore().collection('return-requests').doc(requestId).update({
                status: 'completed',
                adminCondition: condition,
                adminComments: comments,
                penaltyAmount: penaltyAmount,
                reviewDate: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // Record penalty if applicable
            if (penaltyAmount > 0) {
                return firebase.firestore().collection('penalties').add({
                    userId: userId,
                    bookId: bookId,
                    amount: penaltyAmount,
                    reason: `Book returned in ${condition} condition`,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            return Promise.resolve();
        })
        .then(() => {
            alert(`Book return finalized. ${penaltyAmount > 0 ? `Penalty of Rs. ${penaltyAmount} applied.` : 'No penalty applied.'}`);
            
            // Close the modal
            const modalElement = document.getElementById('bookConditionAssessmentModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();
            
            // Reload return requests
            viewReturnRequests();
        })
        .catch((error) => {
            console.error('Error finalizing book return:', error);
            alert('Failed to finalize book return: ' + error.message);
        });
}

function getConditionLabel(condition) {
    const conditionLabels = {
        'good': 'Good Condition',
        'slight-damage': 'Slight Damage',
        'significant-damage': 'Significant Damage'
    };
    return conditionLabels[condition] || condition;
}

function approveReturnRequest(requestId, bookId, userId, condition) {
    let penaltyAmount = 0;

    // Calculate penalty based on book condition
    switch(condition) {
        case 'slight-damage':
            penaltyAmount = 50; // 50 rupees for slight damage
            break;
        case 'significant-damage':
            penaltyAmount = 200; // 200 rupees for significant damage
            break;
    }

    // Fetch book details
    firebase.firestore().collection('books').doc(bookId).get()
        .then((doc) => {
            if (doc.exists) {
                const book = doc.data();
                
                // Update borrowed history
                const updatedBorrowedHistory = book.borrowedHistory.map(entry => {
                    if (entry.borrowerId === userId && !entry.returnDate) {
                        return {
                            ...entry,
                            returnDate: firebase.firestore.Timestamp.now(),
                            condition: condition,
                            penaltyAmount: penaltyAmount
                        };
                    }
                    return entry;
                });

                // Calculate available copies
                const totalCopies = book.totalCopies || 0;
                const activeBorrowedCopies = updatedBorrowedHistory.filter(entry => !entry.returnDate).length;
                const availableCopies = totalCopies - activeBorrowedCopies;

                // Update book document
                return firebase.firestore().collection('books').doc(bookId).update({
                    borrowedHistory: updatedBorrowedHistory,
                    availableCopies: availableCopies,
                    status: availableCopies > 0 ? 'Available' : 'Fully Borrowed'
                });
            } else {
                throw new Error('Book not found');
            }
        })
        .then(() => {
            // Update return request status
            return firebase.firestore().collection('return-requests').doc(requestId).update({
                status: 'approved',
                penaltyAmount: penaltyAmount,
                reviewDate: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // Record penalty if applicable
            if (penaltyAmount > 0) {
                return firebase.firestore().collection('penalties').add({
                    userId: userId,
                    bookId: bookId,
                    amount: penaltyAmount,
                    reason: `Book returned in ${condition} condition`,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            return Promise.resolve();
        })
        .then(() => {
            alert(`Return request approved. ${penaltyAmount > 0 ? `Penalty of Rs. ${penaltyAmount} applied.` : ''}`);
            
            // Reload return requests
            viewReturnRequests();
        })
        .catch((error) => {
            console.error('Error approving return request:', error);
            alert('Failed to approve return request: ' + error.message);
        });
}

function rejectReturnRequest(requestId) {
    firebase.firestore().collection('return-requests').doc(requestId).update({
        status: 'rejected',
        reviewDate: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Return request rejected');
        viewReturnRequests();
    })
    .catch((error) => {
        console.error('Error rejecting return request:', error);
        alert('Failed to reject return request: ' + error.message);
    });
}

function finalizeReturnRequest(requestId, action) {
    let updateData = {};
    let penaltyAmount = 0;

    switch(action) {
        case 'accept':
            const bookCondition = document.getElementById('book-condition').value;
            updateData = {
                status: 'completed',
                adminAction: 'accepted',
                adminCondition: bookCondition,
                adminComments: document.getElementById('admin-comments').value || 'Return request accepted',
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;

        case 'penalty':
            const penaltyCondition = document.getElementById('book-condition').value;
            penaltyAmount = parseInt(document.getElementById('penalty-amount').value);
            updateData = {
                status: 'completed',
                adminAction: 'penalty',
                adminCondition: penaltyCondition,
                penaltyAmount: penaltyAmount,
                adminComments: document.getElementById('penalty-comments').value || `Penalty of Rs. ${penaltyAmount} applied`,
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;

        case 'reject':
            updateData = {
                status: 'rejected',
                adminAction: 'rejected',
                adminComments: document.getElementById('rejection-comments').value || 'Return request rejected',
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;
    }

    // Update return request
    firebase.firestore().collection('return-requests').doc(requestId).update(updateData)
        .then(() => {
            // If penalty, create penalty record
            if (action === 'penalty') {
                return firebase.firestore().collection('penalties').add({
                    requestId: requestId,
                    amount: penaltyAmount,
                    reason: updateData.adminComments,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            return Promise.resolve();
        })
        .then(() => {
            // Close modal
            const modalElement = document.getElementById('returnRequestModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Show success message and reload
            alert('Return request processed successfully');
            fetchReturnRequests();
        })
        .catch((error) => {
            console.error('Error processing return request:', error);
            alert('Failed to process return request: ' + error.message);
        });
}

function processReturnRequest(requestId, action) {
    console.log('Processing return request:', { requestId, action });

    // Validate action
    const validActions = ['accept', 'penalty', 'reject'];
    if (!validActions.includes(action)) {
        console.error('Invalid action:', action);
        alert('Invalid action selected');
        return;
    }

    // Confirm action
    const actionText = {
        'accept': 'accept',
        'penalty': 'accept with penalty',
        'reject': 'reject'
    }[action];

    if (!confirm(`Are you sure you want to ${actionText} this return request?`)) {
        return;
    }

    // Get current user
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert('Authentication required');
        return;
    }

    // Batch write to update multiple documents
    const batch = firebase.firestore().batch();

    // Fetch the return request first
    firebase.firestore().collection('return-requests').doc(requestId).get()
        .then((requestDoc) => {
            if (!requestDoc.exists) {
                throw new Error('Return request not found');
            }

            const requestData = requestDoc.data();
            console.log('Request data:', requestData);

            // Fetch the book details
            return firebase.firestore().collection('books').doc(requestData.bookId).get()
                .then((bookDoc) => {
                    if (!bookDoc.exists) {
                        throw new Error('Book not found');
                    }

                    const bookData = bookDoc.data();
                    console.log('Book data:', bookData);

                    // Prepare updated borrowed history
                    const updatedBorrowedHistory = bookData.borrowedHistory.map(entry => {
                        if (entry.borrowerId === requestData.userId && !entry.returnDate) {
                            return {
                                ...entry,
                                returnDate: firebase.firestore.Timestamp.now(),
                                status: action === 'accept' ? 'returned' : 
                                        action === 'penalty' ? 'returned-with-penalty' : 
                                        'return-rejected'
                            };
                        }
                        return entry;
                    });

                    // Calculate available copies
                    const totalCopies = bookData.totalCopies || 0;
                    const activeBorrowedCopies = updatedBorrowedHistory.filter(entry => !entry.returnDate).length;
                    const availableCopies = totalCopies - activeBorrowedCopies;

                    // Prepare book update
                    const bookUpdateData = {
                        borrowedHistory: updatedBorrowedHistory,
                        availableCopies: availableCopies,
                        status: availableCopies > 0 ? 'Available' : 'Fully Borrowed'
                    };

                    // Update book document in batch
                    const bookRef = firebase.firestore().collection('books').doc(requestData.bookId);
                    batch.update(bookRef, bookUpdateData);

                    // Update return request in batch
                    const requestRef = firebase.firestore().collection('return-requests').doc(requestId);
                    batch.update(requestRef, {
                        status: action === 'reject' ? 'rejected' : 'completed',
                        adminAction: action,
                        processedBy: currentUser.uid,
                        processedDate: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // Commit batch write
                    return batch.commit();
                });
        })
        .then(() => {
            console.log('Return request processed successfully');
            alert('Return request processed successfully');
            
            // Refresh return requests view
            viewReturnRequests();
        })
        .catch((error) => {
            console.error('Error processing return request:', error);
            alert(`Failed to process return request: ${error.message}`);
        });
}

function finalizeReturnRequest(requestId, action) {
    let updateData = {};
    let penaltyAmount = 0;

    switch(action) {
        case 'accept':
            updateData = {
                status: 'completed',
                adminAction: 'accepted',
                adminCondition: 'good',
                adminComments: document.getElementById('admin-comments').value || 'Return request accepted without penalty',
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;

        case 'penalty':
            const penaltyCondition = document.getElementById('book-condition').value;
            penaltyAmount = parseInt(document.getElementById('penalty-amount').value);
            updateData = {
                status: 'completed',
                adminAction: 'penalty',
                adminCondition: penaltyCondition,
                penaltyAmount: penaltyAmount,
                adminComments: document.getElementById('penalty-comments').value || `Penalty of Rs. ${penaltyAmount} applied`,
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;

        case 'reject':
            const rejectCondition = document.getElementById('book-condition').value;
            updateData = {
                status: 'rejected',
                adminAction: 'rejected',
                adminCondition: rejectCondition,
                adminComments: document.getElementById('rejection-comments').value || 'Return request rejected',
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;
    }

    // Update return request
    firebase.firestore().collection('return-requests').doc(requestId).update(updateData)
        .then(() => {
            // If penalty, create penalty record
            if (action === 'penalty') {
                return firebase.firestore().collection('penalties').add({
                    requestId: requestId,
                    amount: penaltyAmount,
                    reason: updateData.adminComments,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            return Promise.resolve();
        })
        .then(() => {
            // Close modal
            const modalElement = document.getElementById('returnRequestModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Show success message and reload
            alert('Return request processed successfully');
            fetchReturnRequests();
        })
        .catch((error) => {
            console.error('Error processing return request:', error);
            alert('Failed to process return request: ' + error.message);
        });
}

function finalizeReturnRequest(requestId, action) {
    let updateData = {};
    let penaltyAmount = 0;

    switch(action) {
        case 'accept':
            const acceptCondition = document.getElementById('book-condition').value;
            updateData = {
                status: 'completed',
                adminAction: 'accepted',
                adminCondition: acceptCondition,
                adminComments: document.getElementById('admin-comments').value || 'Return request accepted without penalty',
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;

        case 'penalty':
            const penaltyCondition = document.getElementById('book-condition').value;
            penaltyAmount = parseInt(document.getElementById('penalty-amount').value);
            updateData = {
                status: 'completed',
                adminAction: 'penalty',
                adminCondition: penaltyCondition,
                penaltyAmount: penaltyAmount,
                adminComments: document.getElementById('penalty-comments').value || `Penalty of Rs. ${penaltyAmount} applied`,
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;

        case 'reject':
            const rejectCondition = document.getElementById('book-condition').value;
            updateData = {
                status: 'rejected',
                adminAction: 'rejected',
                adminCondition: rejectCondition,
                adminComments: document.getElementById('rejection-comments').value || 'Return request rejected',
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;
    }

    // Update return request
    firebase.firestore().collection('return-requests').doc(requestId).update(updateData)
        .then(() => {
            // If penalty, create penalty record
            if (action === 'penalty') {
                return firebase.firestore().collection('penalties').add({
                    requestId: requestId,
                    amount: penaltyAmount,
                    reason: updateData.adminComments,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            return Promise.resolve();
        })
        .then(() => {
            // Close modal
            const modalElement = document.getElementById('returnRequestModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Show success message and reload
            alert('Return request processed successfully');
            fetchReturnRequests();
        })
        .catch((error) => {
            console.error('Error processing return request:', error);
            alert('Failed to process return request: ' + error.message);
        });
}

function finalizeReturnRequest(requestId, action) {
    let updateData = {};
    let penaltyAmount = 0;

    switch(action) {
        case 'accept':
            const bookCondition = document.getElementById('book-condition').value;
            updateData = {
                status: 'completed',
                adminAction: 'accepted',
                adminCondition: bookCondition,
                adminComments: document.getElementById('admin-comments').value || 'Return request accepted without penalty',
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;

        case 'penalty':
            const penaltyCondition = document.getElementById('book-condition').value;
            penaltyAmount = parseInt(document.getElementById('penalty-amount').value);
            updateData = {
                status: 'completed',
                adminAction: 'penalty',
                adminCondition: penaltyCondition,
                penaltyAmount: penaltyAmount,
                adminComments: document.getElementById('penalty-comments').value || `Penalty of Rs. ${penaltyAmount} applied`,
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;

        case 'reject':
            updateData = {
                status: 'rejected',
                adminAction: 'rejected',
                adminComments: document.getElementById('rejection-comments').value || 'Return request rejected',
                processedDate: firebase.firestore.FieldValue.serverTimestamp()
            };
            break;
    }

    // Update return request
    firebase.firestore().collection('return-requests').doc(requestId).update(updateData)
        .then(() => {
            // If penalty, create penalty record
            if (action === 'penalty') {
                return firebase.firestore().collection('penalties').add({
                    requestId: requestId,
                    amount: penaltyAmount,
                    reason: updateData.adminComments,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            return Promise.resolve();
        })
        .then(() => {
            // Close modal
            const modalElement = document.getElementById('returnRequestModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Show success message and reload
            alert('Return request processed successfully');
            fetchReturnRequests();
        })
        .catch((error) => {
            console.error('Error processing return request:', error);
            alert('Failed to process return request: ' + error.message);
        });
}

// Add the following helper functions: createNoFineModal(), createPenaltyModal(), createRejectionModal(), and finalizeReturnRequest()
// These functions are detailed in the previous comprehensive response
