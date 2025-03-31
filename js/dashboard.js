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

async function loadDashboardStatistics(role) {
    // Total Books
    const { data: totalBooks, error: totalBooksError } = await supabase
        .from('books')
        .select('*');
    if (totalBooksError) {
        console.error('Error fetching total books:', totalBooksError.message);
    } else {
        document.getElementById('total-books').textContent = totalBooks.length;
    }

    // Available Books
    const { data: availableBooks, error: availableBooksError } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'Available');
    if (availableBooksError) {
        console.error('Error fetching available books:', availableBooksError.message);
    } else {
        document.getElementById('available-books').textContent = availableBooks.length;
    }

    // Borrowed Books
    const { data: borrowedBooks, error: borrowedBooksError } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'Borrowed');
    if (borrowedBooksError) {
        console.error('Error fetching borrowed books:', borrowedBooksError.message);
    } else {
        document.getElementById('borrowed-books').textContent = borrowedBooks.length;
    }

    // Additional role-specific statistics
    if (role === 'admin') {
        loadRecentActivities();
        loadSystemOverview();
    }
}

// Additional helper functions for admin dashboard

async function loadRecentActivities() {
    const recentActivitiesList = document.getElementById('recent-activities');
    const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error loading recent activities:', error.message);
        recentActivitiesList.innerHTML = '<li class="list-group-item">Unable to load activities</li>';
    } else {
        recentActivitiesList.innerHTML = '';
        activities.forEach((activity) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.textContent = `${activity.description} - ${new Date(activity.timestamp).toLocaleString()}`;
            recentActivitiesList.appendChild(listItem);
        });
    }
}

async function loadSystemOverview() {
    const systemOverview = document.getElementById('system-overview');

    try {
        const [{ data: availableBooks }, { data: borrowedBooks }, { data: students }, { data: teachers }] = await Promise.all([
            supabase.from('books').select('*').eq('status', 'Available'),
            supabase.from('books').select('*').eq('status', 'Borrowed'),
            supabase.from('users').select('*').eq('role', 'student'),
            supabase.from('users').select('*').eq('role', 'teacher')
        ]);

        systemOverview.innerHTML = `
            <p><strong>Available Books:</strong> ${availableBooks.length}</p>
            <p><strong>Borrowed Books:</strong> ${borrowedBooks.length}</p>
            <p><strong>Total Students:</strong> ${students.length}</p>
            <p><strong>Total Teachers:</strong> ${teachers.length}</p>
        `;
    } catch (error) {
        console.error('Error loading system overview:', error.message);
        systemOverview.innerHTML = 'Unable to load system overview';
    }
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

async function loadBookList(role) {
    const bookListContainer = document.getElementById('book-list-container');
    bookListContainer.innerHTML = 'Loading books...';

    const { data: books, error } = await supabase.from('books').select('*');

    if (error) {
        console.error('Error loading books:', error.message);
        bookListContainer.innerHTML = 'Failed to load books';
        return;
    }

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

    books.forEach((book) => {
        const bookId = book.id;
        const totalCopies = book.totalCopies || 0;
        const borrowedHistory = book.borrowedHistory || [];
        const activeBorrowedCopies = borrowedHistory.filter(entry => !entry.returnDate).length;
        const availableCopies = totalCopies - activeBorrowedCopies;

        let actionButtons = '';
        if (role === 'student') {
            const isCurrentUserBorrowed = borrowedHistory.some(
                entry => entry.borrowerId === supabase.auth.user().id && !entry.returnDate
            );

            if (isCurrentUserBorrowed) {
                actionButtons = `
                    <button class="btn btn-sm btn-warning" onclick="returnBook('${bookId}')">
                        <i class="fas fa-undo"></i> Return Book
                    </button>
                `;
            } else if (availableCopies > 0) {
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
}

async function assignBook(bookId) {
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

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    await loadStudentsForAssignment();

    const modalElement = document.getElementById('assignBookModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

async function loadStudentsForAssignment() {
    const studentSelect = document.getElementById('student-select');
    const { data: students, error } = await supabase.from('users').select('*').eq('role', 'student');

    if (error) {
        console.error('Error loading students:', error.message);
        studentSelect.innerHTML = '<option>Failed to load students</option>';
        return;
    }

    studentSelect.innerHTML = '<option value="">Select a student</option>';

    if (students.length === 0) {
        studentSelect.innerHTML = '<option>No students found</option>';
        return;
    }

    students.forEach((student) => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name || 'Unknown'} (${student.email})`;
        studentSelect.appendChild(option);
    });
}

async function confirmBookAssignment(bookId) {
    const studentSelect = document.getElementById('student-select');
    const studentId = studentSelect.value;
    const assignDate = document.getElementById('assign-date').value;
    const dueDate = document.getElementById('due-date').value;

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

    try {
        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('*')
            .eq('id', studentId)
            .single();

        if (studentError || !student) {
            throw new Error('Student not found');
        }

        const { data: book, error: bookError } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (bookError || !book) {
            throw new Error('Book not found');
        }

        const totalCopies = book.totalCopies || 0;
        const borrowedCopies = book.borrowedHistory
            ? book.borrowedHistory.filter(entry => !entry.returnDate).length
            : 0;
        const availableCopies = totalCopies - borrowedCopies;

        if (availableCopies <= 0) {
            throw new Error('No copies of this book are available');
        }

        const { error: updateError } = await supabase
            .from('books')
            .update({
                borrowedHistory: [
                    ...book.borrowedHistory,
                    {
                        borrowerId: studentId,
                        borrowerEmail: student.email,
                        borrowedDate: new Date(assignDate),
                        dueDate: new Date(dueDate),
                        returnDate: null
                    }
                ]
            })
            .eq('id', bookId);

        if (updateError) {
            throw new Error('Failed to update book');
        }

        const { error: borrowError } = await supabase
            .from('borrowings')
            .insert({
                bookId: bookId,
                userId: studentId,
                userEmail: student.email,
                borrowedDate: new Date(assignDate),
                dueDate: new Date(dueDate),
                returnDate: null,
                status: 'Borrowed'
            });

        if (borrowError) {
            throw new Error('Failed to create borrowing record');
        }

        alert('Book assigned successfully!');
        const modalElement = document.getElementById('assignBookModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();

        loadBookList(localStorage.getItem('userRole'));
    } catch (error) {
        console.error('Error assigning book:', error.message);
        alert('Failed to assign book: ' + error.message);
    }
}

// New function to view book details

async function viewBookDetails(bookId) {
    try {
        const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (error || !book) {
            throw new Error('Failed to fetch book details');
        }

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
                                                    <td>${history.borrowedDate ? new Date(history.borrowedDate).toLocaleDateString() : 'N/A'}</td>
                                                    <td>${history.returnDate ? new Date(history.returnDate).toLocaleDateString() : 'Not Returned'}</td>
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
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        const modalElement = document.getElementById('bookDetailsModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error fetching book details:', error.message);
        alert('Failed to fetch book details');
    }
}

// Update addNewBook function to include description

async function addNewBook() {
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

    if (!title || !author || !isbn || !category || !totalCopies) {
        alert('Please fill in all required fields');
        return;
    }

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
        createdAt: new Date(),
        borrowedHistory: []
    };

    try {
        const { error } = await supabase.from('books').insert(bookData);

        if (error) {
            throw new Error('Failed to add book');
        }

        alert('Book added successfully');
        const modalElement = document.getElementById('addBookModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();

        loadBookList(localStorage.getItem('userRole'));
    } catch (error) {
        console.error('Error adding book:', error.message);
        alert('Failed to add book');
    }
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

async function editBook(bookId) {
    try {
        const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (error || !book) {
            throw new Error('Failed to fetch book details');
        }

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
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        const modalElement = document.getElementById('editBookModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error fetching book details:', error.message);
        alert('Failed to fetch book details');
    }
}

// Update Book

async function updateBook(bookId) {
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

    if (!title || !author || !isbn || !category || !totalCopies) {
        alert('Please fill in all required fields');
        return;
    }

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
        updatedAt: new Date()
    };

    try {
        const { error } = await supabase.from('books').update(bookData).eq('id', bookId);

        if (error) {
            throw new Error('Failed to update book');
        }

        alert('Book updated successfully');
        const modalElement = document.getElementById('editBookModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();

        loadBookList(localStorage.getItem('userRole'));
    } catch (error) {
        console.error('Error updating book:', error.message);
        alert('Failed to update book');
    }
}

// Delete Book
async function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        try {
            const { error } = await supabase.from('books').delete().eq('id', bookId);

            if (error) {
                throw new Error('Failed to delete book');
            }

            alert('Book deleted successfully');
            loadBookList(localStorage.getItem('userRole'));
        } catch (error) {
            console.error('Error deleting book:', error.message);
            alert('Failed to delete book');
        }
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

async function loadDocumentList(role) {
    const documentListContainer = document.getElementById('document-list-container');
    documentListContainer.innerHTML = 'Loading documents...';

    const { data: documents, error } = await supabase.from('documents').select('*');

    if (error) {
        console.error('Error loading documents:', error.message);
        documentListContainer.innerHTML = 'Failed to load documents';
        return;
    }

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

    documents.forEach((document) => {
        const documentId = document.id;
        tableHTML += `
            <tr>
                <td>${document.title}</td>
                <td>${document.fileName}</td>
                <td>${document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'Unknown'}</td>
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
}

// View Document Details

async function viewDocument(documentId) {
    try {
        const { data: document, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (error || !document) {
            throw new Error('Failed to fetch document details');
        }

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
                                    <strong>Upload Date:</strong> ${document.uploadedAt ? new Date(document.uploadedAt).toLocaleString() : 'Unknown'}
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
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        const modalElement = document.getElementById('documentDetailsModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error fetching document details:', error.message);
        alert('Failed to fetch document details');
    }
}

// Download Document

async function downloadDocument(documentId) {
    try {
        const { data: document, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (error || !document) {
            throw new Error('Failed to fetch document for download');
        }

        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = document.fileContent; // Assuming fileContent is a URL or base64 data
        link.download = document.fileName;
        link.click();
    } catch (error) {
        console.error('Error downloading document:', error.message);
        alert('Failed to download document');
    }
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

async function uploadDocument() {
    const title = document.getElementById('document-title').value;
    const fileInput = document.getElementById('document-file');

    if (!title || !fileInput.files.length) {
        alert('Please fill in all fields and select a file');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function() {
        const base64data = reader.result;

        try {
            const { error } = await supabase.from('documents').insert({
                title: title,
                fileName: file.name,
                fileContent: base64data,
                uploadedAt: new Date()
            });

            if (error) {
                throw new Error('Failed to upload document');
            }

            alert('Document uploaded successfully');
            const modalElement = document.getElementById('addDocumentModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            loadDocumentList(localStorage.getItem('userRole'));
        } catch (error) {
            console.error('Error uploading document:', error.message);
            alert('Failed to upload document');
        }
    };

    reader.readAsDataURL(file);
}

// Edit Document
async function editDocument(documentId) {
    try {
        const { data: document, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (error || !document) {
            throw new Error('Failed to fetch document details');
        }

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
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        const modalElement = document.getElementById('editDocumentModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error fetching document details:', error.message);
        alert('Failed to fetch document details');
    }
}

// Update Document

async function updateDocument(documentId) {
    const title = document.getElementById('edit-document-title').value;

    if (!title) {
        alert('Please fill in the title');
        return;
    }

    try {
        const { error } = await supabase.from('documents').update({ title: title, updatedAt: new Date() }).eq('id', documentId);

        if (error) {
            throw new Error('Failed to update document');
        }

        alert('Document updated successfully');
        const modalElement = document.getElementById('editDocumentModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();

        loadDocumentList(localStorage.getItem('userRole'));
    } catch (error) {
        console.error('Error updating document:', error.message);
        alert('Failed to update document');
    }
}

// Delete Document
async function deleteDocument(documentId) {
    if (confirm('Are you sure you want to delete this document?')) {
        try {
            const { error } = await supabase.from('documents').delete().eq('id', documentId);

            if (error) {
                throw new Error('Failed to delete document');
            }

            alert('Document deleted successfully');
            loadDocumentList(localStorage.getItem('userRole'));
        } catch (error) {
            console.error('Error deleting document:', error.message);
            alert('Failed to delete document');
        }
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

async function borrowBook(bookId) {
    const currentUser = supabase.auth.user();

    if (!currentUser) {
        alert('Please log in to borrow a book');
        return;
    }

    const borrowedDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    try {
        const { data: book, error: bookError } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (bookError || !book) {
            throw new Error('Book not found');
        }

        const totalCopies = book.totalCopies || 0;
        const borrowedCopies = book.borrowedHistory
            ? book.borrowedHistory.filter(entry => !entry.returnDate).length
            : 0;
        const availableCopies = totalCopies - borrowedCopies;

        if (availableCopies <= 0) {
            alert('Sorry, no copies of this book are currently available');
            return;
        }

        const isAlreadyBorrowed = book.borrowedHistory && book.borrowedHistory.some(
            entry => entry.borrowerId === currentUser.id && !entry.returnDate
        );

        if (isAlreadyBorrowed) {
            alert('You have already borrowed this book');
            return;
        }

        const { error: updateError } = await supabase
            .from('books')
            .update({
                borrowedHistory: [
                    ...book.borrowedHistory,
                    {
                        borrowerId: currentUser.id,
                        borrowerEmail: currentUser.email,
                        borrowedDate: borrowedDate,
                        dueDate: dueDate,
                        returnDate: null
                    }
                ],
                availableCopies: availableCopies - 1,
                status: availableCopies - 1 > 0 ? 'Partially Borrowed' : 'Fully Borrowed'
            })
            .eq('id', bookId);

        if (updateError) {
            throw new Error('Failed to update book');
        }

        const { error: borrowError } = await supabase
            .from('borrowings')
            .insert({
                bookId: bookId,
                userId: currentUser.id,
                userEmail: currentUser.email,
                borrowedDate: borrowedDate,
                dueDate: dueDate,
                returnDate: null,
                status: 'Borrowed'
            });

        if (borrowError) {
            throw new Error('Failed to create borrowing record');
        }

        alert('Book borrowed successfully! Please return within 30 days.');
        loadBookList(localStorage.getItem('userRole'));
    } catch (error) {
        console.error('Error borrowing book:', error.message);
        alert('Failed to borrow book: ' + error.message);
    }
}

async function returnBook(bookId) {
    const currentUser = supabase.auth.user();

    if (!currentUser) {
        alert('Please log in to return a book');
        return;
    }

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

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    const modalElement = document.getElementById('bookReturnModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

async function submitBookReturn(bookId) {
    const currentUser = supabase.auth.user();
    const bookCondition = document.getElementById('book-condition').value;
    const comments = document.getElementById('return-comments').value;

    try {
        const { data: book, error: bookError } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (bookError || !book) {
            throw new Error('Book not found');
        }

        const activeBorrowedEntry = book.borrowedHistory 
            ? book.borrowedHistory.find(
                entry => entry.borrowerId === currentUser.id && !entry.returnDate
            )
            : null;

        if (!activeBorrowedEntry) {
            throw new Error('No active borrowed book found');
        }

        const { error: returnRequestError } = await supabase
            .from('return-requests')
            .insert({
                bookId: bookId,
                userId: currentUser.id,
                userEmail: currentUser.email,
                bookTitle: book.title,
                condition: bookCondition,
                comments: comments,
                status: 'pending',
                requestDate: new Date(),
                borrowedDate: activeBorrowedEntry.borrowedDate
            });

        if (returnRequestError) {
            throw new Error('Failed to submit return request');
        }

        alert('Return request submitted. Awaiting admin/teacher approval.');
        
        const modalElement = document.getElementById('bookReturnModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        loadBookList(localStorage.getItem('userRole'));
    } catch (error) {
        console.error('Error submitting return request:', error.message);
        alert('Failed to submit return request: ' + error.message);
    }
}

async function viewBorrowedBooks(bookId) {
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

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    try {
        const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (error || !book) {
            throw new Error('Failed to fetch borrowed books');
        }

        const borrowedBooksList = document.getElementById('borrowed-books-list');
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

            activeBorrowedBooks.forEach((entry) => {
                tableHTML += `
                    <tr>
                        <td>${entry.borrowerEmail}</td>
                        <td>${entry.borrowedDate ? new Date(entry.borrowedDate).toLocaleDateString() : 'N/A'}</td>
                        <td>${entry.dueDate ? new Date(entry.dueDate).toLocaleDateString() : 'N/A'}</td>
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

        const modalElement = document.getElementById('borrowedBooksModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error fetching borrowed books:', error.message);
        alert('Failed to fetch borrowed books');
    }
}

async function returnBookByAdmin(bookId, borrowerId) {
    try {
        const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (error || !book) {
            throw new Error('Book document not found');
        }

        const borrowedEntryIndex = book.borrowedHistory.findIndex(
            entry => entry.borrowerId === borrowerId && !entry.returnDate
        );

        if (borrowedEntryIndex === -1) {
            throw new Error('No active borrowed entry found for this user');
        }

        const updatedBorrowedHistory = [...book.borrowedHistory];
        updatedBorrowedHistory[borrowedEntryIndex] = {
            ...updatedBorrowedHistory[borrowedEntryIndex],
            returnDate: new Date(),
            status: 'returned'
        };

        const totalCopies = book.totalCopies || 0;
        const activeBorrowedCopies = updatedBorrowedHistory.filter(entry => !entry.returnDate).length;
        const availableCopies = totalCopies - activeBorrowedCopies;

        const { error: updateError } = await supabase
            .from('books')
            .update({
                borrowedHistory: updatedBorrowedHistory,
                availableCopies: availableCopies,
                status: availableCopies > 0 ? 'Available' : 'Fully Borrowed'
            })
            .eq('id', bookId);

        if (updateError) {
            throw new Error('Failed to update book');
        }

        alert('Book returned successfully!');
        viewBorrowedBooks(bookId);
        loadBookList(localStorage.getItem('userRole'));
    } catch (error) {
        console.error('Error returning book:', error.message);
        alert('Failed to return book: ' + error.message);
    }
}

async function viewReturnRequests() {
    const roleContent = document.getElementById('role-content');
    const userRole = localStorage.getItem('userRole');

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

    roleContent.innerHTML = `
        <div class="container-fluid text-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading return requests...</p>
        </div>
    `;

    try {
        const { data: requests, error } = await supabase
            .from('return-requests')
            .select('*')
            .eq('status', 'pending');

        if (error) {
            throw new Error('Failed to load return requests');
        }

        if (requests.length === 0) {
            roleContent.innerHTML = `
                <div class="container-fluid">
                    <div class="alert alert-info">
                        No pending return requests.
                    </div>
                </div>
            `;
            return;
        }

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

        requests.forEach((request) => {
            tableHTML += `
                <tr>
                    <td>${request.bookTitle || 'N/A'}</td>
                    <td>${request.userEmail}</td>
                    <td>${request.borrowedDate ? new Date(request.borrowedDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <span class="badge ${getConditionBadgeClass(request.condition)}">
                            ${request.condition || 'N/A'}
                        </span>
                    </td>
                    <td>${request.comments || 'No comments'}</td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-success" onclick="processReturnRequest('${request.id}', 'accept')">
                                <i class="fas fa-check"></i> Accept
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="processReturnRequest('${request.id}', 'penalty')">
                                <i class="fas fa-dollar-sign"></i> Penalty
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="processReturnRequest('${request.id}', 'reject')">
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
    } catch (error) {
        console.error('Error fetching return requests:', error.message);
        roleContent.innerHTML = `
            <div class="container-fluid">
                <div class="alert alert-danger">
                    Failed to load return requests: ${error.message}
                </div>
            </div>
        `;
    }
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

async function processReturnRequest(requestId, action) {
    console.log('Processing return request:', { requestId, action });

    const validActions = ['accept', 'penalty', 'reject'];
    if (!validActions.includes(action)) {
        console.error('Invalid action:', action);
        alert('Invalid action selected');
        return;
    }

    const actionText = {
        'accept': 'accept',
        'penalty': 'accept with penalty',
        'reject': 'reject'
    }[action];

    if (!confirm(`Are you sure you want to ${actionText} this return request?`)) {
        return;
    }

    const currentUser = supabase.auth.user();
    if (!currentUser) {
        alert('Authentication required');
        return;
    }

    try {
        const { data: request, error: requestError } = await supabase
            .from('return-requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (requestError || !request) {
            throw new Error('Return request not found');
        }

        const { data: book, error: bookError } = await supabase
            .from('books')
            .select('*')
            .eq('id', request.bookId)
            .single();

        if (bookError || !book) {
            throw new Error('Book not found');
        }

        const updatedBorrowedHistory = book.borrowedHistory.map(entry => {
            if (entry.borrowerId === request.userId && !entry.returnDate) {
                return {
                    ...entry,
                    returnDate: new Date(),
                    status: action === 'accept' ? 'returned' : 
                            action === 'penalty' ? 'returned-with-penalty' : 
                            'return-rejected'
                };
            }
            return entry;
        });

        const totalCopies = book.totalCopies || 0;
        const activeBorrowedCopies = updatedBorrowedHistory.filter(entry => !entry.returnDate).length;
        const availableCopies = totalCopies - activeBorrowedCopies;

        const { error: updateBookError } = await supabase
            .from('books')
            .update({
                borrowedHistory: updatedBorrowedHistory,
                availableCopies: availableCopies,
                status: availableCopies > 0 ? 'Available' : 'Fully Borrowed'
            })
            .eq('id', request.bookId);

        if (updateBookError) {
            throw new Error('Failed to update book');
        }

        const updateRequestData = {
            status: action === 'reject' ? 'rejected' : 'completed',
            adminAction: action,
            processedBy: currentUser.id,
            processedDate: new Date()
        };

        const { error: updateRequestError } = await supabase
            .from('return-requests')
            .update(updateRequestData)
            .eq('id', requestId);

        if (updateRequestError) {
            throw new Error('Failed to update return request');
        }

        if (action === 'penalty') {
            const penaltyAmount = parseInt(prompt('Enter penalty amount:', '0'), 10);
            if (isNaN(penaltyAmount) || penaltyAmount <= 0) {
                alert('Invalid penalty amount');
                return;
            }

            const { error: penaltyError } = await supabase
                .from('penalties')
                .insert({
                    userId: request.userId,
                    bookId: request.bookId,
                    amount: penaltyAmount,
                    reason: `Book returned in ${request.condition} condition`,
                    status: 'pending',
                    createdAt: new Date()
                });

            if (penaltyError) {
                throw new Error('Failed to record penalty');
            }
        }

        alert('Return request processed successfully');
        viewReturnRequests();
    } catch (error) {
        console.error('Error processing return request:', error.message);
        alert(`Failed to process return request: ${error.message}`);
    }
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
