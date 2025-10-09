const API_BASE = 'http://localhost:3000/api';

// DOM Elements
let currentUser = null;
let currentTab = 'upcoming';
let allEvents = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function(event) {
    checkAuth();
    setupEventListeners();
    setupProfileEdit();
    loadNotifications();
});

// Show tab with updated event parameter
function showTab(tabName, event) {
    const tabs = ['upcomingTab', 'registeredTab', 'historyTab', 'favoritesTab', 'notificationsTab', 'profileTab'];
    const buttons = document.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        document.getElementById(tab).style.display = 'none';
    });

    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName + 'Tab').style.display = 'block';
    if (event) {
        event.target.classList.add('active');
    }
    currentTab = tabName;

    // Load data for specific tabs
    if (tabName === 'profile') {
        loadProfile();
    } else if (tabName === 'history') {
        loadEventHistory();
    } else if (tabName === 'favorites') {
        loadFavorites();
    } else if (tabName === 'notifications') {
        loadNotifications();
    }
}

// Load event history (past events)
function loadEventHistory() {
    const historyEvents = document.getElementById('historyEvents');
    historyEvents.innerHTML = '<div class="loading">Loading past events...</div>';

    const now = new Date();

    const pastEvents = allEvents.filter(event => new Date(event.date) < now && event.participants && event.participants.some(p => p.user.toString() === currentUser.userId));

    if (pastEvents.length === 0) {
        historyEvents.innerHTML = '<div class="empty-state"><h4>No past events found</h4><p>You have not attended any events yet.</p></div>';
        return;
    }

    const pastHTML = pastEvents.map(event => {
        const date = new Date(event.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="event-card">
                <h4>${event.title}</h4>
                <p class="event-date">📅 ${date}</p>
                <p class="event-location">📍 ${event.location}</p>
                <p>🏷️ ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
                <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                <div class="event-actions">
                    <button class="btn-secondary" onclick="viewEvent('${event._id}')">View Details</button>
                    <button class="btn-secondary" onclick="showFeedbackForm('${event._id}')">Give Feedback</button>
                </div>
            </div>
        `;
    }).join('');

    historyEvents.innerHTML = pastHTML;
}

// Load favorites
async function loadFavorites() {
    const favoriteEvents = document.getElementById('favoriteEvents');
    favoriteEvents.innerHTML = '<div class="loading">Loading favorite events...</div>';

    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const user = await response.json();

        if (!user.favorites || user.favorites.length === 0) {
            favoriteEvents.innerHTML = '<div class="empty-state"><h4>No favorite events</h4><p>You have not added any events to favorites.</p></div>';
            return;
        }

        // Fetch favorite events details
        const eventsPromises = user.favorites.map(eventId =>
            fetch(`${API_BASE}/events/${eventId}`).then(res => res.json())
        );
        const events = await Promise.all(eventsPromises);

        const favHTML = events.map(event => {
            const date = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="event-card">
                    <h4>${event.title}</h4>
                    <p class="event-date">📅 ${date}</p>
                    <p class="event-location">📍 ${event.location}</p>
                    <p>🏷️ ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
                    <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                    <div class="event-actions">
                        <button class="btn-secondary" onclick="viewEvent('${event._id}')">View Details</button>
                        <button class="btn-outline" onclick="removeFromFavorites('${event._id}')">Remove Favorite</button>
                    </div>
                </div>
            `;
        }).join('');

        favoriteEvents.innerHTML = favHTML;
    } catch (error) {
        favoriteEvents.innerHTML = '<div class="empty-state"><h4>Error loading favorites</h4></div>';
        console.error('Error loading favorites:', error);
    }
}

// Add to favorites
async function addToFavorites(eventId) {
    try {
        const response = await fetch(`${API_BASE}/auth/favorites/${eventId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            if (currentTab === 'favorites') {
                loadFavorites();
            }
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error adding to favorites');
        console.error(error);
    }
}

// Remove from favorites
async function removeFromFavorites(eventId) {
    try {
        const response = await fetch(`${API_BASE}/auth/favorites/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            if (currentTab === 'favorites') {
                loadFavorites();
            }
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error removing from favorites');
        console.error(error);
    }
}

// Load notifications (dummy for now)
function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    // For demo, static notifications
    const notifications = [
        'You have successfully registered for "Science Fair 2024".',
        'Reminder: "Art Workshop" is tomorrow at 3 PM.',
        'Feedback submitted for "Tech Talk". Thank you!'
    ];

    if (notifications.length === 0) {
        notificationsList.innerHTML = '<li>No notifications yet.</li>';
    } else {
        notificationsList.innerHTML = notifications.map(note => `<li>${note}</li>`).join('');
    }
}

// Setup profile edit form
function setupProfileEdit() {
    const editBtn = document.getElementById('editProfileBtn');
    const formContainer = document.getElementById('editProfileForm');
    const profileInfo = document.getElementById('profileInfo');
    const cancelBtn = document.getElementById('cancelEditProfile');
    const profileForm = document.getElementById('profileForm');

    editBtn.addEventListener('click', () => {
        // Populate form with current info
        document.getElementById('editUsername').value = currentUser.username || '';
        document.getElementById('editCollegeName').value = currentUser.collegeName || '';
        document.getElementById('editDepartment').value = currentUser.department || '';
        document.getElementById('editMobileNo').value = currentUser.mobileNo || '';

        profileInfo.style.display = 'none';
        editBtn.style.display = 'none';
        formContainer.style.display = 'block';
    });

    cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
        profileInfo.style.display = 'block';
        editBtn.style.display = 'inline-block';
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
            username: document.getElementById('editUsername').value,
            collegeName: document.getElementById('editCollegeName').value,
            department: document.getElementById('editDepartment').value,
            mobileNo: document.getElementById('editMobileNo').value,
        };

        try {
            const response = await fetch(`${API_BASE}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Profile updated successfully');
                currentUser = { ...currentUser, ...result };
                displayUserInfo();
                formContainer.style.display = 'none';
                profileInfo.style.display = 'block';
                editBtn.style.display = 'inline-block';
            } else {
                alert('Error updating profile: ' + result.message);
            }
        } catch (error) {
            alert('Error updating profile');
            console.error(error);
        }
    });
}

// Show feedback form modal
async function showFeedbackForm(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const event = await response.json();

        if (response.ok) {
            renderFeedbackForm(event);
            document.getElementById('eventModal').style.display = 'block';
        } else {
            alert('Error loading feedback form');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading feedback form');
    }
}

// Render feedback form inside event modal
function renderFeedbackForm(event) {
    const modalContent = `
        <h3>Feedback for ${event.title}</h3>
        <form id="feedbackForm">
            <label for="rating">Rating (1-5):</label>
            <input type="number" id="rating" name="rating" min="1" max="5" required>
            <label for="comment">Comment:</label>
            <textarea id="comment" name="comment" rows="4"></textarea>
            <button type="submit" class="submit-btn">Submit Feedback</button>
        </form>
    `;

    document.getElementById('eventDetails').innerHTML = modalContent;

    const feedbackForm = document.getElementById('feedbackForm');
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitFeedback(event._id);
    });
}

// Submit feedback
async function submitFeedback(eventId) {
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ rating, comment })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            closeModal();
        } else {
            alert('Error submitting feedback: ' + result.message);
        }
    } catch (error) {
        alert('Error submitting feedback');
        console.error(error);
    }
}

// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser = payload;

        // Validate token by fetching profile
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        const user = await response.json();
        currentUser = { ...currentUser, ...user };
        displayUserInfo();
        loadEvents();
    } catch (error) {
        console.error('Invalid token or error validating token');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const user = await response.json();

        if (response.ok) {
            currentUser = { ...currentUser, ...user };
            displayUserInfo();
        } else {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            console.error('Failed to load user profile');
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Display user information
function displayUserInfo() {
    if (!currentUser) return;

    const userInfo = document.getElementById('userInfo');
    const userRole = document.getElementById('userRole');
    const userCollege = document.getElementById('userCollege');

    userRole.textContent = `Role: Student`;
    userCollege.textContent = `College: ${currentUser.collegeName || 'Not specified'}`;
}

// Setup event listeners
function setupEventListeners() {
    // Search and filter
    document.getElementById('searchInput').addEventListener('input', filterEvents);
    document.getElementById('categoryFilter').addEventListener('change', filterEvents);

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

// Load events
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE}/events`);

        const events = await response.json();

        if (response.ok) {
            allEvents = events;
            displayEvents(events);
        } else {
            showError('Failed to load events');
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showError('Error loading events');
    }
}

// Display events
function displayEvents(events) {
    const upcomingEvents = document.getElementById('upcomingEvents');
    const registeredEvents = document.getElementById('registeredEvents');

    if (!events || events.length === 0) {
        upcomingEvents.innerHTML = '<div class="empty-state"><h4>No events found</h4><p>Check back later for new events!</p></div>';
        registeredEvents.innerHTML = '<div class="empty-state"><h4>No registered events</h4><p>You haven\'t registered for any events yet.</p></div>';
        return;
    }

    // Filter upcoming events (future events)
    const now = new Date();
    const upcoming = events.filter(event => new Date(event.date) > now);
    const registered = events.filter(event => event.participants && event.participants.some(p => p.user.toString() === currentUser.userId));

    // Display upcoming events
    const upcomingHTML = upcoming.map(event => {
        const date = new Date(event.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const isRegistered = event.participants && event.participants.some(p => p.user.toString() === currentUser.userId);

        const isFavorite = currentUser.favorites && currentUser.favorites.includes(event._id);

        return `
            <div class="event-card">
                <h4>${event.title}</h4>
                <p class="event-date">📅 ${date}</p>
                <p class="event-location">📍 ${event.location}</p>
                <p>🏷️ ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
                <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                <div class="event-actions">
                    <button class="btn-secondary" onclick="viewEvent('${event._id}')">View Details</button>
                    <button class="${isRegistered ? 'btn-outline' : 'btn-secondary'}" onclick="${isRegistered ? `toggleRegistration('${event._id}')` : `showRegistrationModal('${event._id}')`}">
                        ${isRegistered ? 'Unregister' : 'Register'}
                    </button>
                    <button class="${isFavorite ? 'btn-outline' : 'btn-secondary'}" onclick="${isFavorite ? `removeFromFavorites('${event._id}')` : `addToFavorites('${event._id}')`}">
                        ${isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    upcomingEvents.innerHTML = upcomingHTML || '<div class="empty-state"><h4>No upcoming events</h4><p>Check back later for new events!</p></div>';

    // Display registered events
    const registeredHTML = registered.map(event => {
        const date = new Date(event.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const eventDate = new Date(event.date);
        const now = new Date();
        const isPast = eventDate < now;

        // Check if feedback already submitted
        const participant = event.participants.find(p => p.user === currentUser.userId || p.user === currentUser._id);
        const hasFeedback = participant && participant.feedback && participant.feedback.rating;

        let feedbackButton = '';
        if (isPast && !hasFeedback) {
            feedbackButton = `<button class="btn-secondary" onclick="showFeedbackForm('${event._id}')">Give Feedback</button>`;
        } else if (isPast && hasFeedback) {
            feedbackButton = `<button class="btn-outline" disabled>Feedback Submitted</button>`;
        }

        return `
            <div class="event-card">
                <h4>${event.title}</h4>
                <p class="event-date">📅 ${date}</p>
                <p class="event-location">📍 ${event.location}</p>
                <p>🏷️ ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
                <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                <div class="event-actions">
                    <button class="btn-secondary" onclick="viewEvent('${event._id}')">View Details</button>
                    <button class="btn-outline" onclick="toggleRegistration('${event._id}')">Unregister</button>
                    ${feedbackButton}
                </div>
            </div>
        `;
    }).join('');

    registeredEvents.innerHTML = registeredHTML || '<div class="empty-state"><h4>No registered events</h4><p>You haven\'t registered for any events yet.</p></div>';
}

// Filter events
function filterEvents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;

    let filteredEvents = allEvents;

    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm)
        );
    }

    if (categoryFilter) {
        filteredEvents = filteredEvents.filter(event => event.category === categoryFilter);
    }

    displayEvents(filteredEvents);
}

// View event details
async function viewEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const event = await response.json();

        if (response.ok) {
            showEventModal(event);
        } else {
            alert('Error loading event details');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading event details');
    }
}

// Show event modal
function showEventModal(event) {
    const date = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const isRegistered = event.participants && event.participants.some(p => p.user.toString() === currentUser.userId);

    const modalContent = `
        <h3>${event.title}</h3>
        <img src="${event.image}" alt="${event.title}" style="max-width: 100%; height: auto;">
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Category:</strong> ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
        <p><strong>Description:</strong></p>
        <p>${event.description}</p>
        <p><strong>Max Attendees:</strong> ${event.maxAttendees || 'Unlimited'}</p>
        <div style="margin-top: 20px;">
            <button class="${isRegistered ? 'btn-outline' : 'btn-secondary'}" onclick="toggleRegistration('${event._id}'); closeModal();">
                ${isRegistered ? 'Unregister' : 'Register'}
            </button>
        </div>
    `;

    document.getElementById('eventDetails').innerHTML = modalContent;
    document.getElementById('eventModal').style.display = 'block';
}

// Toggle event registration
async function toggleRegistration(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            loadEvents(); // Refresh events
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

// Load profile
async function loadProfile() {
    // For now, just display basic info from token
    const profileInfo = document.getElementById('profileInfo');
    profileInfo.innerHTML = `
        <p><strong>Name:</strong> ${currentUser.username || 'N/A'}</p>
        <p><strong>Email:</strong> ${currentUser.email || 'N/A'}</p>
        <p><strong>College:</strong> ${currentUser.collegeName || 'N/A'}</p>
        <p><strong>Department:</strong> ${currentUser.department || 'N/A'}</p>
        <p><strong>Mobile:</strong> ${currentUser.mobileNo || 'N/A'}</p>
    `;
}



// Close modal
function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Show error
function showError(message) {
    const upcomingEvents = document.getElementById('upcomingEvents');
    const registeredEvents = document.getElementById('registeredEvents');

    upcomingEvents.innerHTML = `<div class="empty-state"><h4>Error</h4><p>${message}</p></div>`;
    registeredEvents.innerHTML = `<div class="empty-state"><h4>Error</h4><p>${message}</p></div>`;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const eventModal = document.getElementById('eventModal');
    const registrationModal = document.getElementById('registrationModal');
    if (event.target === eventModal) {
        closeModal();
    }
    if (event.target === registrationModal) {
        closeRegistrationModal();
    }
}

// Show registration modal
async function showRegistrationModal(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const event = await response.json();

        if (response.ok) {
            // Check if user is already registered
            const isRegistered = event.participants && event.participants.some(p => p.user.toString() === currentUser.userId);
            let existingRegistration = null;

            if (isRegistered) {
                // Fetch existing registration data
                existingRegistration = event.participants.find(p => p.user.toString() === currentUser.userId);
            }

            renderRegistrationForm(event, existingRegistration);
            document.getElementById('registrationModal').style.display = 'block';
        } else {
            alert('Error loading registration form');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading registration form');
    }
}

// Close registration modal
function closeRegistrationModal() {
    document.getElementById('registrationModal').style.display = 'none';
}

// Render registration form with custom questions
function renderRegistrationForm(event, existingRegistration = null) {
    const container = document.getElementById('registrationContent');

    // Extract existing data if available
    const regData = existingRegistration ? existingRegistration.registrationData || {} : {};
    const customAnswers = existingRegistration ? existingRegistration.customAnswers || [] : [];

    let formHtml = `
        <form id="registrationForm">
            <input type="hidden" name="eventId" value="${event._id}">
            <div class="form-group">
                <label for="studentName">Student Name *</label>
                <input type="text" id="studentName" name="studentName" value="${regData.studentName || ''}" required>
            </div>
            <div class="form-group">
                <label for="rollNo">Roll Number *</label>
                <input type="text" id="rollNo" name="rollNo" value="${regData.rollNo || ''}" required>
            </div>
            <div class="form-group">
                <label for="class">Class *</label>
                <input type="text" id="class" name="class" value="${regData.class || ''}" required>
            </div>
            <div class="form-group">
                <label for="phone">Phone Number *</label>
                <input type="tel" id="phone" name="phone" value="${regData.phone || ''}" required>
            </div>
            <div class="form-group">
                <label for="department">Department *</label>
                <input type="text" id="department" name="department" value="${regData.department || ''}" required>
            </div>
            <div class="form-group">
                <label for="year">Year *</label>
                <select id="year" name="year" required>
                    <option value="">Select year</option>
                    <option value="1" ${regData.year === '1' ? 'selected' : ''}>1st Year</option>
                    <option value="2" ${regData.year === '2' ? 'selected' : ''}>2nd Year</option>
                    <option value="3" ${regData.year === '3' ? 'selected' : ''}>3rd Year</option>
                    <option value="4" ${regData.year === '4' ? 'selected' : ''}>4th Year</option>
                    <option value="5" ${regData.year === '5' ? 'selected' : ''}>5th Year</option>
                </select>
            </div>
            <div class="form-group">
                <label for="dietary">Dietary Preferences</label>
                <input type="text" id="dietary" name="dietary" value="${regData.dietary || ''}" placeholder="e.g., Vegetarian, Vegan">
            </div>
            <div class="form-group">
                <label for="specialNeeds">Special Needs</label>
                <textarea id="specialNeeds" name="specialNeeds" rows="3" placeholder="Any special requirements or accommodations">${regData.specialNeeds || ''}</textarea>
            </div>
    `;

    // Add custom questions dynamically
    if (event.customQuestions && event.customQuestions.length > 0) {
        formHtml += `<h4>Additional Questions</h4>`;
        event.customQuestions.forEach((question, index) => {
            const qId = question._id;
            const qLabel = question.question;
            const qType = question.type;
            const existingAnswer = customAnswers.find(ans => ans.questionId === qId);

            formHtml += `<div class="form-group">`;
            formHtml += `<label for="custom_${qId}">${qLabel}</label>`;

            if (qType === 'text') {
                formHtml += `<input type="text" id="custom_${qId}" name="custom_${qId}" value="${existingAnswer ? existingAnswer.answer : ''}">`;
            } else if (qType === 'textarea') {
                formHtml += `<textarea id="custom_${qId}" name="custom_${qId}">${existingAnswer ? existingAnswer.answer : ''}</textarea>`;
            } else if (qType === 'select') {
                formHtml += `<select id="custom_${qId}" name="custom_${qId}">`;
                formHtml += `<option value="">Select an option</option>`;
                question.options.forEach(option => {
                    const selected = existingAnswer && existingAnswer.answer === option ? 'selected' : '';
                    formHtml += `<option value="${option}" ${selected}>${option}</option>`;
                });
                formHtml += `</select>`;
            } else if (qType === 'checkbox') {
                question.options.forEach(option => {
                    const checked = existingAnswer && existingAnswer.answer && existingAnswer.answer.includes(option) ? 'checked' : '';
                    formHtml += `
                        <label><input type="checkbox" name="custom_${qId}" value="${option}" ${checked}> ${option}</label><br>
                    `;
                });
            } else if (qType === 'radio') {
                question.options.forEach(option => {
                    const checked = existingAnswer && existingAnswer.answer === option ? 'checked' : '';
                    formHtml += `
                        <label><input type="radio" name="custom_${qId}" value="${option}" ${checked}> ${option}</label><br>
                    `;
                });
            }

            formHtml += `</div>`;
        });
    }

    formHtml += `
            <div class="form-group checkbox-group">
                <label><input type="checkbox" name="termsAccepted" ${regData.termsAccepted ? 'checked' : ''} required> I accept the terms and conditions *</label>
            </div>
            <div class="form-group checkbox-group">
                <label><input type="checkbox" name="receiveUpdates" ${regData.receiveUpdates ? 'checked' : ''}> I want to receive updates about future events</label>
            </div>
            <button type="submit" class="submit-btn">Submit Registration</button>
        </form>
    `;

    container.innerHTML = formHtml;

    // Add submit event listener
    const form = document.getElementById('registrationForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitRegistrationForm(event._id);
    });
}

// Submit registration form
async function submitRegistrationForm(eventId) {
    const form = document.getElementById('registrationForm');
    const formData = new FormData(form);

    // Convert FormData to JSON object
    const data = {};
    formData.forEach((value, key) => {
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    });

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            closeRegistrationModal();
            loadEvents();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error submitting registration:', error);
        alert('An error occurred while submitting registration.');
    }
}
