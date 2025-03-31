import { supabase } from './supabase-config.js';

// User Management Core Functionality
function loadUserManagementSection(role) {
    console.log('Loading User Management Section - Role:', role);

    const roleContent = document.getElementById('role-content');
    if (!roleContent) {
        console.error('Role content element not found');
        return;
    }

    if (role !== 'admin') {
        roleContent.innerHTML = `
            <div class="container-fluid">
                <div class="alert alert-danger">
                    You do not have permission to access User Management.
                </div>
            </div>
        `;
        return;
    }

    roleContent.innerHTML = `
        <div class="container-fluid">
            <h2 class="mb-4">User Management</h2>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <button class="btn btn-primary" onclick="openAddUserModal()">
                        <i class="fas fa-plus me-2"></i>Add New User
                    </button>
                </div>
                <div class="col-md-6">
                    <input type="text" id="user-search" class="form-control" placeholder="Search Users" onkeyup="searchUsers()">
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped" id="user-list-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Registration Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="user-list-body">
                                <!-- Users will be dynamically loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadUserList();
}

async function loadUserList() {
    const userListBody = document.getElementById('user-list-body');
    if (!userListBody) {
        console.error('User list body not found');
        return;
    }

    userListBody.innerHTML = '<tr><td colspan="5" class="text-center">Loading users...</td></tr>';

    try {
        const { data: users, error } = await supabase.from('user_profiles').select('*');

        if (error) {
            throw new Error('Failed to load users');
        }

        userListBody.innerHTML = '';

        users.forEach((user) => {
            const userRow = document.createElement('tr');
            userRow.innerHTML = `
                <td>${user.name || 'N/A'}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info" onclick="viewUserProfile('${user.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editUserModal('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            userListBody.appendChild(userRow);
        });
    } catch (error) {
        console.error('Error loading users:', error.message);
        userListBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Failed to load users: ${error.message}
                </td>
            </tr>
        `;
    }
}

function openAddUserModal() {
    const modalHTML = `
        <div class="modal fade" id="addUserModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New User</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Full Name</label>
                            <input type="text" id="new-user-name" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email Address</label>
                            <input type="email" id="new-user-email" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" id="new-user-password" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Department</label>
                            <select id="new-user-department" class="form-control">
                                <option value="">Select Department</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Electrical Engineering">Electrical Engineering</option>
                                <option value="Mechanical Engineering">Mechanical Engineering</option>
                                <option value="Business Administration">Business Administration</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">User Role</label>
                            <select id="new-user-role" class="form-control">
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="createNewUser()">Create User</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    const modalElement = document.getElementById('addUserModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

async function createNewUser() {
    const name = document.getElementById('new-user-name').value;
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const department = document.getElementById('new-user-department').value;
    const role = document.getElementById('new-user-role').value;

    if (!name || !email || !password || !department) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const { user, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (signUpError) {
            throw new Error('Failed to create user: ' + signUpError.message);
        }

        const { error: profileError } = await supabase.from('user_profiles').insert({
            id: user.id,
            name: name,
            email: email,
            role: role,
            department: department,
            created_at: new Date(),
            status: 'active'
        });

        if (profileError) {
            throw new Error('Failed to create user profile: ' + profileError.message);
        }

        alert('User created successfully');
        const modalElement = document.getElementById('addUserModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        loadUserList();
    } catch (error) {
        console.error('Error creating user:', error.message);
        alert('Failed to create user: ' + error.message);
    }
}

async function viewUserDetails(userId) {
    try {
        const { data: user, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            throw new Error('Failed to fetch user details');
        }

        const modalHTML = `
            <div class="modal fade" id="userDetailsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">User Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <strong>Name:</strong> ${user.name}
                                </div>
                                <div class="col-md-6">
                                    <strong>Email:</strong> ${user.email}
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <strong>Role:</strong> ${user.role}
                                </div>
                                <div class="col-md-6">
                                    <strong>Department:</strong> ${user.department || 'N/A'}
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <strong>Registration Date:</strong> 
                                    ${user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}
                                </div>
                                <div class="col-md-6">
                                    <strong>Status:</strong> ${user.status}
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
        
        const modalElement = document.getElementById('userDetailsModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error fetching user details:', error.message);
        alert('Failed to fetch user details');
    }
}

async function editUserModal(userId) {
    try {
        const { data: user, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            throw new Error('Failed to fetch user details');
        }

        const modalHTML = `
            <div class="modal fade" id="editUserModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit User</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Full Name</label>
                                <input type="text" id="edit-user-name" class="form-control" value="${user.name}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email Address</label>
                                <input type="email" id="edit-user-email" class="form-control" value="${user.email}" disabled>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Department</label>
                                <select id="edit-user-department" class="form-control">
                                    <option value="Computer Science" ${user.department === 'Computer Science' ? 'selected' : ''}>Computer Science</option>
                                    <option value="Electrical Engineering" ${user.department === 'Electrical Engineering' ? 'selected' : ''}>Electrical Engineering</option>
                                    <option value="Mechanical Engineering" ${user.department === 'Mechanical Engineering' ? 'selected' : ''}>Mechanical Engineering</option>
                                    <option value="Business Administration" ${user.department === 'Business Administration' ? 'selected' : ''}>Business Administration</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">User Role</label>
                                <select id="edit-user-role" class="form-control">
                                    <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                                    <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Teacher</option>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="updateUser('${user.id}')">Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        
        const modalElement = document.getElementById('editUserModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error fetching user details:', error.message);
        alert('Failed to fetch user details');
    }
}

async function updateUser(userId) {
    const name = document.getElementById('edit-user-name').value;
    const department = document.getElementById('edit-user-department').value;
    const role = document.getElementById('edit-user-role').value;

    if (!name) {
        alert('Please enter a name');
        return;
    }

    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({
                name: name,
                department: department,
                role: role,
                updated_at: new Date()
            })
            .eq('id', userId);

        if (error) {
            throw new Error('Failed to update user');
        }

        alert('User updated successfully');
        const modalElement = document.getElementById('editUserModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        loadUserList();
    } catch (error) {
        console.error('Error updating user:', error.message);
        alert('Failed to update user');
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', userId);

            if (error) {
                throw new Error('Failed to delete user');
            }

            alert('User deleted successfully');
            loadUserList();
        } catch (error) {
            console.error('Error deleting user:', error.message);
            alert('Failed to delete user');
        }
    }
}

function searchUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const rows = document.querySelectorAll('#user-list-body tr');

    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        const shouldShow = Array.from(cells).some(cell => 
            cell.textContent.toLowerCase().includes(searchTerm)
        );
        row.style.display = shouldShow ? '' : 'none';
    });
}

async function viewUserProfile(userId) {
    try {
        const { data: userData, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !userData) {
            throw new Error('Failed to fetch user details');
        }

        const modalHTML = `
            <div class="modal fade" id="userProfileModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">User Profile Details</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4 text-center">
                                    <img src="${userData.profilePicture || 'assets/default-profile.png'}" 
                                         class="img-fluid rounded-circle mb-3" 
                                         alt="Profile Picture" 
                                         style="max-width: 200px; max-height: 200px;">
                                    <h4>${userData.name || 'N/A'}</h4>
                                    <p class="text-muted">${userData.email}</p>
                                </div>
                                <div class="col-md-8">
                                    <h5>Personal Information</h5>
                                    <hr>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <strong>Full Name:</strong> ${userData.name || 'N/A'}
                                        </div>
                                        <div class="col-md-6">
                                            <strong>Email:</strong> ${userData.email}
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <strong>Role:</strong> ${userData.role || 'N/A'}
                                        </div>
                                        <div class="col-md-6">
                                            <strong>Department:</strong> ${userData.department || 'N/A'}
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <strong>Registration Date:</strong> 
                                            ${userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div class="col-md-6">
                                            <strong>Last Login:</strong> 
                                            ${userData.last_login ? new Date(userData.last_login).toLocaleString() : 'N/A'}
                                        </div>
                                    </div>
                                    <h5 class="mt-4">Account Status</h5>
                                    <hr>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <strong>Status:</strong> 
                                            <span class="badge ${getStatusBadgeClass(userData.status)}">
                                                ${userData.status || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="editUserProfile('${userId}')">
                                <i class="fas fa-edit me-2"></i>Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        const modalElement = document.getElementById('userProfileModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error fetching user details:', error.message);
        alert('Failed to fetch user details');
    }
}

async function editUserProfile(userId) {
    try {
        const { data: userData, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !userData) {
            throw new Error('Failed to fetch user details');
        }

        const modalHTML = `
            <div class="modal fade" id="editUserProfileModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Edit User Profile</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4 text-center">
                                    <img id="profile-preview" 
                                         src="${userData.profilePicture || 'assets/default-profile.png'}" 
                                         class="img-fluid rounded-circle mb-3" 
                                         alt="Profile Picture" 
                                         style="max-width: 200px; max-height: 200px;">
                                    <input type="file" id="profile-picture" class="form-control" accept="image/*">
                                </div>
                                <div class="col-md-8">
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Full Name</label>
                                            <input type="text" id="edit-name" class="form-control" 
                                                   value="${userData.name || ''}" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Email</label>
                                            <input type="email" class="form-control" 
                                                   value="${userData.email}" disabled>
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Role</label>
                                            <select id="edit-role" class="form-control">
                                                <option value="student" ${userData.role === 'student' ? 'selected' : ''}>Student</option>
                                                <option value="teacher" ${userData.role === 'teacher' ? 'selected' : ''}>Teacher</option>
                                                <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>Admin</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Department</label>
                                            <select id="edit-department" class="form-control">
                                                <option value="Computer Science" ${userData.department === 'Computer Science' ? 'selected' : ''}>Computer Science</option>
                                                <option value="Electrical Engineering" ${userData.department === 'Electrical Engineering' ? 'selected' : ''}>Electrical Engineering</option>
                                                <option value="Mechanical Engineering" ${userData.department === 'Mechanical Engineering' ? 'selected' : ''}>Mechanical Engineering</option>
                                                <option value="Business Administration" ${userData.department === 'Business Administration' ? 'selected' : ''}>Business Administration</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Account Status</label>
                                            <select id="edit-status" class="form-control">
                                                <option value="active" ${userData.status === 'active' ? 'selected' : ''}>Active</option>
                                                <option value="inactive" ${userData.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                                <option value="suspended" ${userData.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="saveUserProfile('${userId}')">
                                <i class="fas fa-save me-2"></i>Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        document.getElementById('profile-picture').addEventListener('change', function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                document.getElementById('profile-preview').src = e.target.result;
            }
            
            reader.readAsDataURL(file);
        });

        const modalElement = document.getElementById('editUserProfileModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error fetching user details:', error.message);
        alert('Failed to fetch user details');
    }
}

async function saveUserProfile(userId) {
    const name = document.getElementById('edit-name').value;
    const role = document.getElementById('edit-role').value;
    const department = document.getElementById('edit-department').value;
    const status = document.getElementById('edit-status').value;
    const profilePictureFile = document.getElementById('profile-picture').files[0];

    if (!name) {
        alert('Name is required');
        return;
    }

    const updateData = {
        name: name,
        role: role,
        department: department,
        status: status,
        updated_at: new Date()
    };

    if (profilePictureFile) {
        const { data, error: uploadError } = await supabase.storage
            .from('profile_pictures')
            .upload(`public/${userId}`, profilePictureFile, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('Profile picture upload error:', uploadError.message);
            alert('Failed to upload profile picture');
            return;
        }

        const { publicURL, error: urlError } = supabase.storage
            .from('profile_pictures')
            .getPublicUrl(`public/${userId}`);

        if (urlError) {
            console.error('Error getting public URL:', urlError.message);
            alert('Failed to get profile picture URL');
            return;
        }

        updateData.profilePicture = publicURL;
    }

    try {
        const { error } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            throw new Error('Failed to update profile');
        }

        alert('Profile updated successfully');
        
        const modalElement = document.getElementById('editUserProfileModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        loadUserList();
    } catch (error) {
        console.error('Error updating user profile:', error.message);
        alert('Failed to update profile');
    }
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'active': return 'bg-success';
        case 'inactive': return 'bg-warning';
        case 'suspended': return 'bg-danger';
        default: return 'bg-secondary';
    }
}