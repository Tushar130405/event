// API Base URL
const API_BASE = 'http://localhost:3000/api';

// DOM Elements
let currentUser = null;
let currentTab = 'overview';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Decode token to get user info
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser = payload;
        displayUserInfo();
        loadDashboardData();
    } catch (error) {
        console.error('Invalid token');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Display user information
function displayUserInfo() {
    if (!currentUser) return;

    const userInfo = document.getElementById('userInfo');
    const userRole = document.getElementById('userRole');
    const userCollege = document.getElementById('userCollege');

    userRole.textContent = `Role: Admin`;
    userCollege.textContent = `College: ${currentUser.collegeName || 'Not specified'}`;
}

// Setup event listeners
function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Mobile navigation
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // Close mobile menu when clicking close button
    const closeNav = document.getElementById('closeNav');
    if (closeNav) {
        closeNav.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks && !menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load events for stats
        const eventsResponse = await fetch(`${API_BASE}/events`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const events = await eventsResponse.json();

        if (eventsResponse.ok) {
            updateStats(events);
        }

        // Load users for user management
        if (currentTab === 'users') {
            loadUsers();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update statistics
function updateStats(events) {
    const totalEvents = events.length;
    const upcomingEvents = events.filter(event => new Date(event.date) > new Date()).length;

    // For demo purposes, set dummy values for users
    // In a real app, you'd have a users endpoint
    const totalUsers = 150; // Dummy value
    const activeUsers = 89; // Dummy value

    document.getElementById('totalEvents').textContent = totalEvents;
    document.getElementById('upcomingEvents').textContent = upcomingEvents;
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
}

// Load users
async function loadUsers() {
    // For demo purposes, create dummy users
    // In a real app, you'd fetch from an API
    const dummyUsers = [
        { _id: '1', username: 'john_doe', email: 'john@example.com', role: 'student', collegeName: 'ABC College' },
        { _id: '2', username: 'jane_smith', email: 'jane@example.com', role: 'teacher', collegeName: 'ABC College' },
        { _id: '3', username: 'admin_user', email: 'admin@example.com', role: 'admin', collegeName: 'ABC College' },
        { _id: '4', username: 'student2', email: 'student2@example.com', role: 'student', collegeName: 'XYZ College' },
    ];

    displayUsers(dummyUsers);
}

// Display users
function displayUsers(users) {
    const usersList = document.getElementById('usersList');

    if (!users || users.length === 0) {
        usersList.innerHTML = '<div class="empty-state"><h4>No users found</h4></div>';
        return;
    }

    const usersHTML = users.map(user => `
        <div class="user-card">
            <h4>${user.username}</h4>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            <p><strong>College:</strong> ${user.collegeName}</p>
            <div class="user-actions">
                <button class="btn-small btn-edit" onclick="editUser('${user._id}')">Edit</button>
                <button class="btn-small btn-delete" onclick="deleteUser('${user._id}')">Delete</button>
            </div>
        </div>
    `).join('');

    usersList.innerHTML = usersHTML;
}

// Edit user (placeholder)
function editUser(userId) {
    alert('Edit user functionality would be implemented here');
}

// Delete user (placeholder)
function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        alert('Delete user functionality would be implemented here');
    }
}

// Tab switching
function showTab(tabName) {
    const tabs = ['overviewTab', 'eventsTab', 'usersTab', 'analyticsTab', 'settingsTab'];
    const buttons = document.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        document.getElementById(tab).style.display = 'none';
    });

    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName + 'Tab').style.display = 'block';
    event.target.classList.add('active');
    currentTab = tabName;

    // Load data for specific tabs
    if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'analytics') {
        loadAnalytics();
    } else if (tabName === 'settings') {
        loadSettings();
    }
}

// Load analytics (placeholder with dummy charts)
function loadAnalytics() {
    // In a real app, you'd use Chart.js or similar library
    // For now, just show placeholder text
    document.getElementById('categoryChart').innerHTML = '<p style="text-align: center; padding: 40px;">Chart would show event categories distribution</p>';
    document.getElementById('trendChart').innerHTML = '<p style="text-align: center; padding: 40px;">Chart would show event trends over time</p>';
}

// Load settings (placeholder)
function loadSettings() {
    // In a real app, you'd load settings from an API
    // For now, just set up the form submit handler
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
    }
}

// Handle settings form submit
function handleSettingsSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const settings = Object.fromEntries(formData.entries());

    // In a real app, you'd send this to an API
    alert('Settings saved successfully!\n' + JSON.stringify(settings, null, 2));
}

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}
