// API_BASE is already defined in utils.js, no need to redefine it

// DOM Elements
let currentUser = null;
let currentTab = 'upcoming';
let allEvents = [];

console.log('user-dashboard.js loaded');

// Show tab with updated event parameter - DEFINE EARLY so inline onclick handlers work
window.showTab = function(tabName, event) {
    console.log('=== showTab called ===');
    console.log('tabName:', tabName);
    console.log('currentUser:', currentUser);
    
    const tabs = ['upcomingTab', 'registeredTab', 'ticketsTab', 'historyTab', 'favoritesTab', 'notificationsTab', 'profileTab'];
    const buttons = document.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        const el = document.getElementById(tab);
        if (el) el.style.display = 'none';
    });

    buttons.forEach(btn => btn.classList.remove('active'));

    const tabElement = document.getElementById(tabName + 'Tab');
    if (tabElement) {
        tabElement.style.display = 'block';
    }
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // If no event, find and activate the button for this tab name
        const tabMap = {
            'upcoming': 'Upcoming Events',
            'registered': 'My Events',
            'tickets': 'My Tickets',
            'history': 'Event History',
            'favorites': 'Favorites',
            'notifications': 'Notifications',
            'profile': 'Profile'
        };
        
        buttons.forEach(btn => {
            if (btn.textContent.includes(tabMap[tabName])) {
                btn.classList.add('active');
            }
        });
    }
    
    currentTab = tabName;
    console.log('currentTab set to:', currentTab);

    // Load data for specific tabs
    if (tabName === 'profile') {
        console.log('Loading profile...');
        loadProfile();
    } else if (tabName === 'history') {
        console.log('Loading event history...');
        loadEventHistory();
    } else if (tabName === 'favorites') {
        console.log('Loading favorites...');
        loadFavorites();
    } else if (tabName === 'notifications') {
        console.log('Loading notifications...');
        loadNotifications();
    } else if (tabName === 'registered') {
        console.log('Loading registered events...');
        loadRegisteredEvents();
    } else if (tabName === 'upcoming') {
        console.log('Loading upcoming events...');
        loadEvents();
    } else if (tabName === 'tickets') {
        console.log('Loading e-passes...');
        loadUserEPasses();
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', async function(event) {
    await checkAuth();
    setupEventListeners();
    setupProfileEdit();
    loadNotifications();
    // ensure the initial tab is shown and data is populated
    window.showTab('upcoming');
    // pre-fetch tickets count so summary card is accurate even if user doesn't click the tab
    loadUserEPasses().catch(err => console.warn('preload epasses error', err));
});

// Load event history (past events)
window.loadEventHistory = function() {
    const historyEvents = document.getElementById('historyEvents');
    historyEvents.innerHTML = '<div class="loading">Loading past events...</div>';

    const now = new Date();

    const pastEvents = allEvents.filter(event => new Date(event.date) < now && event.participants && event.participants.some(p => p.user && (p.user.toString() === currentUser.userId || p.user.toString() === currentUser._id)));

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
                <div class="event-card-header">
                    <img src="${event.image || 'images/default-event.jpg'}" alt="${event.title}" class="event-card-image">
                    <div class="event-card-category">${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</div>
                    <div class="event-card-status">
                        <span class="event-status past">Past Event</span>
                    </div>
                </div>
                <div class="event-card-body">
                    <h4 class="event-card-title">${event.title}</h4>
                    <div class="event-card-meta">
                        <div class="event-meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${date}</span>
                        </div>
                        <div class="event-meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.location}</span>
                        </div>
                        <div class="event-meta-item">
                            <i class="fas fa-users"></i>
                            <span>${event.participants ? event.participants.length : 0} attended</span>
                        </div>
                    </div>
                    <p class="event-card-description">${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                </div>
                <div class="event-card-footer">
                    <div class="event-card-actions">
                        <button class="btn-primary" onclick="viewEvent('${event._id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="btn-secondary" onclick="showFeedbackForm('${event._id}')">
                            <i class="fas fa-star"></i> Give Feedback
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    historyEvents.innerHTML = pastHTML;
};

// Load favorites
window.loadFavorites = async function() {
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
                    <div class="event-card-header">
                        <img src="${event.image || 'images/default-event.jpg'}" alt="${event.title}" class="event-card-image">
                        <div class="event-card-category">${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</div>
                        <div class="event-card-status">
                            <i class="fas fa-heart favorite"></i>
                        </div>
                    </div>
                    <div class="event-card-body">
                        <h4 class="event-card-title">${event.title}</h4>
                        <div class="event-card-meta">
                            <div class="event-meta-item">
                                <i class="fas fa-calendar-alt"></i>
                                <span>${date}</span>
                            </div>
                            <div class="event-meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${event.location}</span>
                            </div>
                            <div class="event-meta-item">
                                <i class="fas fa-users"></i>
                                <span>${event.participants ? event.participants.length : 0} attending</span>
                            </div>
                        </div>
                        <p class="event-card-description">${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                    </div>
                    <div class="event-card-footer">
                        <div class="event-card-actions">
                            <button class="btn-primary" onclick="viewEvent('${event._id}')">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            <button class="btn-outline" onclick="removeFromFavorites('${event._id}')">
                                <i class="fas fa-heart"></i> Remove Favorite
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        favoriteEvents.innerHTML = favHTML;
    } catch (error) {
        favoriteEvents.innerHTML = '<div class="empty-state"><h4>Error loading favorites</h4></div>';
        console.error('Error loading favorites:', error);
    }
};

// Add to favorites
window.addToFavorites = async function(eventId) {
    try {
        const response = await fetch(`${API_BASE}/auth/favorites/${eventId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const result = await response.json();
        if (response.ok) {
            toast.success(result.message);
            if (currentTab === 'favorites') {
                window.loadFavorites();
            }
        } else {
            toast.error('Error: ' + result.message);
        }
    } catch (error) {
        toast.error('Error adding to favorites');
        console.error(error);
    }
};

// Remove from favorites
window.removeFromFavorites = async function(eventId) {
    try {
        const response = await fetch(`${API_BASE}/auth/favorites/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const result = await response.json();
        if (response.ok) {
            toast.success(result.message);
            if (currentTab === 'favorites') {
                window.loadFavorites();
            }
        } else {
            toast.error('Error: ' + result.message);
        }
    } catch (error) {
        toast.error('Error removing from favorites');
        console.error(error);
    }
};

// Load notifications (dummy for now)
window.loadNotifications = function() {
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
};

// Load user E-Passes (Tickets)
window.loadUserEPasses = async function() {
    const ticketsContainer = document.getElementById('myTicketsContainer');
    if (!ticketsContainer) return;

    console.log('user-dashboard: loadUserEPasses called');
    ticketsContainer.innerHTML = '<div class="loading">Loading your e-passes...</div>';

    try {
        const response = await fetch(`${API_BASE}/epasses/user/my-tickets`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        console.log('user-dashboard: e-pass API status', response.status);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('user-dashboard: e-pass API error payload', error);
            ticketsContainer.innerHTML = `<div class="empty-state"><h4>Error loading tickets</h4><p>${error.error || 'Failed to load your tickets'}</p></div>`;
            updateTicketsCount(0);
            return;
        }

        const data = await response.json();
        console.log('user-dashboard: e-pass API response', data);
        const tickets = data.tickets || [];

        // update summary counter regardless of tickets length
        updateTicketsCount(tickets.length);

        if (tickets.length === 0) {
            ticketsContainer.innerHTML = `
                <div class="empty-state">
                    <h4>No E-Passes Yet</h4>
                    <p>Register for events that have E-Pass enabled to receive your digital tickets.</p>
                </div>
            `;
            return;
        }

        let ticketHtml = '<div class="tickets-grid">';

        tickets.forEach(ticket => {
            const eventDate = new Date(ticket.eventDate);
            const dateStr = eventDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            });
            const timeStr = eventDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit'
            });

            const statusBadgeClass = {
                'generated': 'generated',
                'sent': 'sent',
                'verified': 'verified',
                'used': 'used'
            }[ticket.status] || 'generated';

            const statusLabel = {
                'generated': 'Generated',
                'sent': 'Sent',
                'verified': 'Verified',
                'used': 'Entry Used'
            }[ticket.status] || 'Generated';

            ticketHtml += `
                <div class="ticket-card">
                    <div class="ticket-header">
                        <div class="ticket-event-info">
                            <h3 class="ticket-event-title">${ticket.eventTitle}</h3>
                            <p class="ticket-category">${ticket.eventCategory}</p>
                        </div>
                        <span class="ticket-status-badge ${statusBadgeClass}">${statusLabel}</span>
                    </div>

                    <div class="ticket-details">
                        <div class="ticket-detail-row">
                            <span class="detail-icon">📅</span>
                            <div class="detail-content">
                                <p class="detail-label">Date & Time</p>
                                <p class="detail-value">${dateStr} at ${timeStr}</p>
                            </div>
                        </div>

                        <div class="ticket-detail-row">
                            <span class="detail-icon">📍</span>
                            <div class="detail-content">
                                <p class="detail-label">Location</p>
                                <p class="detail-value">${ticket.eventLocation}</p>
                            </div>
                        </div>

                        <div class="ticket-detail-row">
                            <span class="detail-icon">👤</span>
                            <div class="detail-content">
                                <p class="detail-label">Attendee Name</p>
                                <p class="detail-value">${ticket.participantName}</p>
                            </div>
                        </div>
                    </div>

                    <div class="ticket-qr-section">
                        <p class="qr-label">Scan for Entry</p>
                        ${ticket.qrCode ? `<img src="${ticket.qrCode}" alt="E-Pass QR Code" class="ticket-qr-code">` : '<p class="no-qr">QR Code not available</p>'}
                    </div>

                    <div class="ticket-actions">
                        <button class="btn-download" onclick="window.downloadEPass('${ticket.id}', '${ticket.eventTitle}')">
                            <i class="fas fa-download"></i> Download E-Pass
                        </button>
                        <button class="btn-details" onclick="window.viewEPassDetails('${ticket.id}')">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                    </div>
                </div>
            `;
        });

        ticketHtml += '</div>';
        ticketsContainer.innerHTML = ticketHtml;
    } catch (error) {
        console.error('Error loading e-passes:', error);
        ticketsContainer.innerHTML = `
            <div class="empty-state">
                <h4>Error Loading Tickets</h4>
                <p>Could not load your e-passes. Please try again later.</p>
            </div>
        `;
        updateTicketsCount(0);
    }
};

// helper to update tickets count in summary card
function updateTicketsCount(count) {
    const ticketsEl = document.getElementById('ticketsCount');
    if (ticketsEl) ticketsEl.textContent = count;
}

// Download E-Pass as PDF or image
window.downloadEPass = function(epassId, eventTitle) {
    try {
        // Create a link element and trigger download
        const link = document.createElement('a');
        link.href = `${API_BASE}/epasses/${epassId}`;
        link.download = `epass-${eventTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('E-Pass download started');
    } catch (error) {
        console.error('Download error:', error);
        toast.error('Failed to download E-Pass');
    }
};

// View E-Pass details
window.viewEPassDetails = async function(epassId) {
    try {
        const response = await fetch(`${API_BASE}/epasses/${epassId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            toast.error('Failed to load E-Pass details');
            return;
        }

        const epass = await response.json();
        const eventDate = new Date(epass.eventDate);
        const dateStr = eventDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });

        const detailsHtml = `
            <div class="epass-details-modal">
                <h2>E-Pass Details</h2>
                <div class="details-section">
                    <h3>${epass.eventTitle}</h3>
                    <p><strong>Category:</strong> ${epass.eventCategory}</p>
                    <p><strong>Date:</strong> ${dateStr}</p>
                    <p><strong>Location:</strong> ${epass.eventLocation}</p>
                    <p><strong>Status:</strong> <span class="status-badge">${epass.status}</span></p>
                    <p><strong>Attendee:</strong> ${epass.participantName}</p>
                    ${epass.verifiedAt ? `<p><strong>Entry Verified:</strong> ${new Date(epass.verifiedAt).toLocaleString()}</p>` : ''}
                </div>
                ${epass.qrCode ? `
                    <div class="qr-details">
                        <h4>QR Code</h4>
                        <img src="${epass.qrCode}" alt="QR Code" style="max-width: 300px; margin: 20px 0;">
                        <p class="qr-instructions">Show this QR code at the event entrance for quick check-in</p>
                    </div>
                ` : ''}
                <button class="btn-close" onclick="document.getElementById('detailsModal').style.display='none'">Close</button>
            </div>
        `;

        // Create modal if it doesn't exist
        let detailsModal = document.getElementById('detailsModal');
        if (!detailsModal) {
            detailsModal = document.createElement('div');
            detailsModal.id = 'detailsModal';
            detailsModal.className = 'modal';
            document.body.appendChild(detailsModal);
        }

        const content = detailsModal.querySelector('.modal-content') || document.createElement('div');
        content.className = 'modal-content';
        content.innerHTML = detailsHtml;
        detailsModal.appendChild(content);
        detailsModal.style.display = 'block';

        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                detailsModal.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error fetching e-pass details:', error);
        toast.error('Failed to load E-Pass details');
    }
};

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
                toast.success('Profile updated successfully');
                currentUser = { ...currentUser, ...result };
                displayUserInfo();
                formContainer.style.display = 'none';
                profileInfo.style.display = 'block';
                editBtn.style.display = 'inline-block';
            } else {
                toast.error('Error updating profile: ' + result.message);
            }
        } catch (error) {
            toast.error('Error updating profile');
            console.error(error);
        }
    });
}

// Show feedback form modal
window.showFeedbackForm = async function(eventId) {
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
            toast.error('Error loading feedback form');
        }
    } catch (error) {
        console.error('Error:', error);
        toast.error('Error loading feedback form');
    }
};

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
window.submitFeedback = async function(eventId) {
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
            toast.success(result.message);
            window.closeModal();
        } else {
            toast.error('Error submitting feedback: ' + result.message);
        }
    } catch (error) {
        toast.error('Error submitting feedback');
        console.error(error);
    }
};

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
        
        // Ensure we have a consistent userId property
        if (!currentUser.userId && currentUser._id) {
            currentUser.userId = currentUser._id;
        } else if (!currentUser.userId && currentUser.id) {
            currentUser.userId = currentUser.id;
        }
        
        displayUserInfo();
        await loadEvents();
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
            // Ensure we have a consistent userId property
            if (!currentUser.userId && currentUser._id) {
                currentUser.userId = currentUser._id;
            } else if (!currentUser.userId && currentUser.id) {
                currentUser.userId = currentUser.id;
            }
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

    // Extract role from token if available, default to Student
    const tokenRole = currentUser.role || 'student';
    const displayRole = tokenRole.charAt(0).toUpperCase() + tokenRole.slice(1);
    
    userRole.textContent = `Role: ${displayRole}`;
    userCollege.textContent = `Organization: ${currentUser.collegeName || 'Not specified'}`;
}

// Setup event listeners
function setupEventListeners() {
    // Search and filter
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterEvents);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterEvents);
    }

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
window.loadEvents = async function() {
    try {
        const response = await fetch(`${API_BASE}/events`);

        const events = await response.json();

        if (response.ok) {
            allEvents = events;
            window.displayEvents(events);

            // Update dashboard summary counts if present
            try {
                const now = new Date();
                const upcomingCount = events.filter(ev => new Date(ev.date) > now).length;
                const registeredCount = events.filter(ev => ev.participants && ev.participants.some(p => p.user && (p.user.toString() === currentUser.userId || p.user.toString() === currentUser._id))).length;
                const upcomingEl = document.getElementById('upcomingCount');
                const registeredEl = document.getElementById('registeredCount');
                if (upcomingEl) upcomingEl.textContent = upcomingCount;
                if (registeredEl) registeredEl.textContent = registeredCount;
            } catch (e) {
                console.error('Error updating summary counts', e);
            }
        } else {
            window.showError('Failed to load events');
        }
    } catch (error) {
        console.error('Error loading events:', error);
        window.showError('Error loading events');
    }
};

// load only events the current user has registered for
window.loadRegisteredEvents = async function() {
    try {
        console.log('=== loadRegisteredEvents called ===');
        console.log('currentUser:', currentUser);
        
        const registeredEvents = document.getElementById('registeredEvents');
        if (!registeredEvents) {
            console.error('registeredEvents container not found!');
            return;
        }
        
        registeredEvents.innerHTML = '<div class="loading">Loading your registered events...</div>';
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            registeredEvents.innerHTML = '<div class="empty-state"><h4>Authentication Error</h4><p>Please log in again.</p></div>';
            return;
        }
        
        console.log('Fetching from: ' + `${API_BASE}/events/registered`);
        const response = await fetch(`${API_BASE}/events/registered`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response status:', response.status);
        const events = await response.json();
        console.log('Events data:', events);

        if (response.ok) {
            if (!events || events.length === 0) {
                console.log('No registered events found - showing empty state');
                registeredEvents.innerHTML = `<div class="empty-state">
                    <h4>No Registered Events</h4>
                    <p>You haven't registered for any events yet.</p>
                    <p style="margin-top: 15px; font-size: 12px; color: #999;">
                        <strong>Troubleshooting:</strong><br>
                        1. Go to "Upcoming Events" tab and click "Register" on an event<br>
                        2. If you've registered but don't see events here, check the Profile tab > Debug section<br>
                        3. Make sure your college name is set in your profile
                    </p>
                </div>`;
                
                // update dashboard counts
                const registeredEl = document.getElementById('registeredCount');
                if (registeredEl) registeredEl.textContent = '0';
                return;
            }

            console.log('Rendering ' + events.length + ' registered events');
            
            // Display registered events
            const registeredHTML = events.map(event => {
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
                const participant = event.participants.find(p => {
                    const pUserId = p.user ? (p.user._id ? p.user._id.toString() : p.user.toString()) : null;
                    const currentUserId = currentUser._id || currentUser.userId;
                    return pUserId === currentUserId.toString();
                });
                const hasFeedback = participant && participant.feedback && participant.feedback.rating;

                let feedbackButton = '';
                if (isPast && !hasFeedback) {
                    feedbackButton = `<button class="btn-secondary" onclick="showFeedbackForm('${event._id}')">Give Feedback</button>`;
                } else if (isPast && hasFeedback) {
                    feedbackButton = `<button class="btn-outline" disabled>Feedback Submitted</button>`;
                }

        return `
            <div class="event-card">
                <div class="event-card-header">
                    <img src="${event.image || 'images/default-event.jpg'}" alt="${event.title}" class="event-card-image">
                    <div class="event-card-category">${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</div>
                    <div class="event-card-status">
                        <i class="fas fa-check-circle registered"></i>
                        ${isPast ? '<span class="event-status past">Past Event</span>' : '<span class="event-status upcoming">Upcoming</span>'}
                    </div>
                </div>
                <div class="event-card-body">
                    <h4 class="event-card-title">${event.title}</h4>
                    <div class="event-card-meta">
                        <div class="event-meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${date}</span>
                        </div>
                        <div class="event-meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.location}</span>
                        </div>
                        <div class="event-meta-item">
                            <i class="fas fa-users"></i>
                            <span>${event.participants ? event.participants.length : 0} attending</span>
                        </div>
                    </div>
                    <p class="event-card-description">${event.description.substring(0, 120)}${event.description.length > 120 ? '...' : ''}</p>
                </div>
                <div class="event-card-footer">
                    <div class="event-card-actions">
                        <button class="btn-primary" onclick="viewEvent('${event._id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="btn-outline" onclick="toggleRegistration('${event._id}')">
                            <i class="fas fa-times"></i> Unregister
                        </button>
                        ${feedbackButton}
                    </div>
                </div>
            </div>
        `;
            }).join('');

            registeredEvents.innerHTML = registeredHTML;
            console.log('Successfully displayed registered events');

            // update dashboard counts
            const registeredEl = document.getElementById('registeredCount');
            if (registeredEl) registeredEl.textContent = events.length;
        } else {
            console.error('API error response:', response.status, events);
            registeredEvents.innerHTML = `<div class="empty-state">
                <h4>Error Loading Events</h4>
                <p>Status: ${response.status}</p>
                <p>Message: ${events.message || 'Unknown error'}</p>
                <p style="font-size: 12px;">Check the browser console and Profile > Debug section for more info.</p>
            </div>`;
        }
    } catch (error) {
        console.error('ERROR in loadRegisteredEvents:', error);
        const registeredEvents = document.getElementById('registeredEvents');
        if (registeredEvents) {
            registeredEvents.innerHTML = `<div class="empty-state">
                <h4>Error Loading Events</h4>
                <p>${error.message}</p>
                <p style="font-size: 12px;">Check browser console for details.</p>
            </div>`;
        }
    }
};

// Display events
window.displayEvents = function(events) {
    const upcomingEvents = document.getElementById('upcomingEvents');
    const registeredEvents = document.getElementById('registeredEvents');

    if (!events || events.length === 0) {
        if (upcomingEvents) {
            upcomingEvents.innerHTML = '<div class="empty-state"><h4>No events found</h4><p>Check back later for new events!</p></div>';
        }
        if (registeredEvents) {
            registeredEvents.innerHTML = '<div class="empty-state"><h4>No registered events</h4><p>You haven\'t registered for any events yet.</p></div>';
        }
        return;
    }

    // Filter upcoming events (future events)
    const now = new Date();
    const upcoming = events.filter(event => new Date(event.date) > now);
    const registered = events.filter(event => event.participants && event.participants.some(p => p.user && (p.user.toString() === currentUser.userId || p.user.toString() === currentUser._id)));

    // Display upcoming events
    const upcomingHTML = upcoming.map(event => {
        const date = new Date(event.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const isRegistered = event.participants && event.participants.some(p => p.user && (p.user.toString() === currentUser.userId || p.user.toString() === currentUser._id));
        const isStudent = currentUser.role === 'student' || currentUser.role === undefined; // Assume student if no role

        const isFavorite = currentUser.favorites && currentUser.favorites.includes(event._id);

        let registrationBtn = '';
        if (isStudent) {
            registrationBtn = `<button class="${isRegistered ? 'btn-outline' : 'btn-secondary'}" onclick="${isRegistered ? `toggleRegistration('${event._id}')` : `showRegistrationModal('${event._id}')`}">
                        ${isRegistered ? 'Unregister' : 'Register'}
                    </button>`;
        } else {
            registrationBtn = `<button class="btn-outline" disabled style="cursor: not-allowed; opacity: 0.6;">Not Available</button>`;
        }

        return `
            <div class="event-card">
                <div class="event-card-header">
                    <img src="${event.image || 'images/default-event.jpg'}" alt="${event.title}" class="event-card-image">
                    <div class="event-card-category">${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</div>
                    <div class="event-card-status">
                        ${isFavorite ? '<i class="fas fa-heart"></i>' : ''}
                        ${isRegistered ? '<i class="fas fa-check-circle"></i>' : ''}
                    </div>
                </div>
                <div class="event-card-body">
                    <h4 class="event-card-title">${event.title}</h4>
                    <div class="event-card-meta">
                        <div class="event-meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${date}</span>
                        </div>
                        <div class="event-meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.location}</span>
                        </div>
                        <div class="event-meta-item">
                            <i class="fas fa-users"></i>
                            <span>${event.participants ? event.participants.length : 0} attending</span>
                        </div>
                    </div>
                    <p class="event-card-description">${event.description.substring(0, 120)}${event.description.length > 120 ? '...' : ''}</p>
                </div>
                <div class="event-card-footer">
                    <div class="event-card-actions">
                        <button class="btn-primary" onclick="viewEvent('${event._id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        ${registrationBtn}
                        ${isFavorite ? `<button class="btn-favorite active" onclick="removeFromFavorites('${event._id}')"><i class="fas fa-heart"></i></button>` : `<button class="btn-favorite" onclick="addToFavorites('${event._id}')"><i class="far fa-heart"></i></button>`}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (upcomingEvents) {
        upcomingEvents.innerHTML = upcomingHTML || '<div class="empty-state"><h4>No upcoming events</h4><p>Check back later for new events!</p></div>';
    }

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
                <img src="${event.image || 'images/default-event.jpg'}" alt="${event.title}">
                <div class="event-card-category">${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</div>
                <div class="event-card-body">
                    <h4>${event.title}</h4>
                    <p class="event-date">📅 ${date}</p>
                    <p class="event-date">📍 ${event.location}</p>
                    <p class="event-desc">${event.description.substring(0, 130)}${event.description.length > 130 ? '...' : ''}</p>
                </div>
                <div class="event-actions">
                    <button class="btn-secondary" onclick="viewEvent('${event._id}')">View Details</button>
                    <button class="btn-outline" onclick="toggleRegistration('${event._id}')">Unregister</button>
                    ${feedbackButton}
                </div>
            </div>
        `;
    }).join('');

    if (registeredEvents) {
        registeredEvents.innerHTML = registeredHTML || '<div class="empty-state"><h4>No registered events</h4><p>You haven\'t registered for any events yet.</p></div>';
    }
}

// Filter events
window.filterEvents = function() {
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

    window.displayEvents(filteredEvents);
};

// View event details
window.viewEvent = async function(eventId) {
    try {
        showLoader('Loading event...');
        const response = await fetch(`${API_BASE}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const event = await response.json();
        hideLoader();
        if (response.ok) {
            window.showEventModal(event);
        } else {
            toast.error('Error loading event details');
        }
    } catch (error) {
        hideLoader();
        console.error('Error:', error);
        toast.error('Error loading event details');
    }
};

// Show event modal
window.showEventModal = function(event) {
    const date = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const isRegistered = event.participants && event.participants.some(p => p.user && (p.user.toString() === currentUser.userId || p.user.toString() === currentUser._id));

    // build register/unregister button - using form for initial registration
    let registerBtnHtml = '';
    if (isRegistered) {
        // still allow immediate unregister
        registerBtnHtml = `<button class="btn-outline" onclick="toggleRegistration('${event._id}'); closeModal();">Unregister</button>`;
    } else {
        // open form to collect registration details
        registerBtnHtml = `<button class="btn-secondary" onclick="closeModal(); showRegistrationModal('${event._id}')">Register</button>`;
    }

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
            ${registerBtnHtml}
        </div>
    `;

    document.getElementById('eventDetails').innerHTML = modalContent;
    document.getElementById('eventModal').style.display = 'block';
};

// Toggle event registration
window.toggleRegistration = async function(eventId) {
    try {
        showLoader('Processing registration...');
        const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        hideLoader();
        console.log('Registration toggle response:', result);
        
        if (response.ok) {
            toast.success(result.message);
            // Reload both upcoming and registered events to reflect changes
            window.loadEvents();
            window.loadRegisteredEvents();
        } else {
            toast.error('Error: ' + result.message);
        }
    } catch (error) {
        hideLoader();
        console.error('Error:', error);
        toast.error('An error occurred');
    }
};

// Load profile
window.loadProfile = async function() {
    // For now, just display basic info from token
    const profileInfo = document.getElementById('profileInfo');
    profileInfo.innerHTML = `
        <p><strong>Name:</strong> ${currentUser.username || 'N/A'}</p>
        <p><strong>Email:</strong> ${currentUser.email || 'N/A'}</p>
        <p><strong>Organization:</strong> ${currentUser.collegeName || 'N/A'}</p>
        <p><strong>Department:</strong> ${currentUser.department || 'N/A'}</p>
        <p><strong>Mobile:</strong> ${currentUser.mobileNo || 'N/A'}</p>
    `;

    // Update email verification status
    updateEmailVerificationStatus();
};

// Update email verification status display
function updateEmailVerificationStatus() {
    const statusDiv = document.getElementById('emailVerificationStatus');
    const formDiv = document.getElementById('emailVerificationForm');
    const verifiedDiv = document.getElementById('emailVerifiedMessage');
    const statusText = document.getElementById('emailStatus');

    if (currentUser.emailVerified) {
        // Email is verified
        statusDiv.style.display = 'block';
        formDiv.style.display = 'none';
        verifiedDiv.style.display = 'block';
        statusText.innerHTML = '<i class="fas fa-check-circle" style="color: #27ae60;"></i> Your email is verified';
    } else {
        // Email is not verified
        statusDiv.style.display = 'block';
        formDiv.style.display = 'block';
        verifiedDiv.style.display = 'none';
        statusText.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #e74c3c;"></i> Your email is not verified yet';
        setupEmailVerificationListeners();
    }
}

// Setup email verification event listeners
function setupEmailVerificationListeners() {
    const sendBtn = document.getElementById('sendEmailOtpBtn');
    const verifyBtn = document.getElementById('verifyEmailOtpBtn');
    
    if (sendBtn) {
        sendBtn.removeEventListener('click', handleSendEmailOtp);
        sendBtn.addEventListener('click', handleSendEmailOtp);
    }
    
    if (verifyBtn) {
        verifyBtn.removeEventListener('click', handleVerifyEmailOtp);
        verifyBtn.addEventListener('click', handleVerifyEmailOtp);
    }
}

// Send email verification OTP
async function handleSendEmailOtp(e) {
    e.preventDefault();
    const sendBtn = document.getElementById('sendEmailOtpBtn');
    const messageEl = document.getElementById('emailOtpMessage');
    const otpInputSection = document.getElementById('otpInputSection');
    
    try {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        
        const response = await fetch(`${API_BASE}/auth/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: currentUser.email }),
        });

        const data = await response.json();

        if (response.ok) {
            messageEl.textContent = '✓ Code sent to your email!';
            messageEl.style.color = '#27ae60';
            otpInputSection.style.display = 'block';
        } else {
            messageEl.textContent = data.message || 'Failed to send code';
            messageEl.style.color = '#e74c3c';
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        messageEl.textContent = 'Error sending code. Please try again.';
        messageEl.style.color = '#e74c3c';
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = '📧 Send Verification Code';
    }
}

// Verify email OTP
async function handleVerifyEmailOtp(e) {
    e.preventDefault();
    const otpInput = document.getElementById('emailOtpCode');
    const errorEl = document.getElementById('emailOtpError');
    const verifyBtn = document.getElementById('verifyEmailOtpBtn');
    
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
        errorEl.textContent = 'Please enter a valid 6-digit code';
        return;
    }
    
    try {
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';
        errorEl.textContent = '';
        
        const response = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: currentUser.email,
                otp: otp
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // Update current user's emailVerified flag
            currentUser.emailVerified = true;
            errorEl.textContent = '';
            errorEl.style.display = 'none';
            updateEmailVerificationStatus();
            toast.success('Email verified successfully!');
        } else {
            errorEl.textContent = data.message || 'Invalid code. Please try again.';
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        errorEl.textContent = 'Error verifying code. Please try again.';
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify';
    }
}

// Close modal
window.closeModal = function() {
    document.getElementById('eventModal').style.display = 'none';
};

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Show error
window.showError = function(message) {
    const upcomingEvents = document.getElementById('upcomingEvents');
    const registeredEvents = document.getElementById('registeredEvents');

    upcomingEvents.innerHTML = `<div class="empty-state"><h4>Error</h4><p>${message}</p></div>`;
    registeredEvents.innerHTML = `<div class="empty-state"><h4>Error</h4><p>${message}</p></div>`;
};

// Close modal when clicking outside
window.onclick = function(event) {
    const eventModal = document.getElementById('eventModal');
    const registrationModal = document.getElementById('registrationModal');
    if (event.target === eventModal) {
        window.closeModal();
    }
    if (event.target === registrationModal) {
        window.closeRegistrationModal();
    }
}

// Show registration modal
window.showRegistrationModal = async function(eventId) {
    // Check if user is a student
    const isStudent = currentUser.role === 'student' || currentUser.role === undefined;
    if (!isStudent) {
        toast.warning('Only students can register for events.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const event = await response.json();

        if (response.ok) {
            // Check if user is already registered
            const isRegistered = event.participants && event.participants.some(p => p.user && (p.user.toString() === currentUser.userId || p.user.toString() === currentUser._id));
            let existingRegistration = null;

            if (isRegistered) {
                // Fetch existing registration data
                existingRegistration = event.participants.find(p => p.user && (p.user.toString() === currentUser.userId || p.user.toString() === currentUser._id));
            }

            renderRegistrationForm(event, existingRegistration);
            document.getElementById('registrationModal').style.display = 'block';
        } else {
            toast.error('Error loading registration form');
        }
    } catch (error) {
        console.error('Error:', error);
        toast.error('Error loading registration form');
    }
};

// Close registration modal
window.closeRegistrationModal = function() {
    document.getElementById('registrationModal').style.display = 'none';
};

// Render registration form with custom questions
function renderRegistrationForm(event, existingRegistration = null) {
    const container = document.getElementById('registrationContent');

    // Extract existing data if available
    const regData = existingRegistration ? existingRegistration.registrationData || {} : {};
    const customAnswers = existingRegistration ? existingRegistration.customAnswers || [] : [];

    // Helper to compute fields (same logic as index-events.js)
    function getRegistrationFields(category) {
        const common = [
            { id: 'studentName', name: 'studentName', label: 'Name', type: 'text', required: true },
        ];
        const cat = (category || '').toLowerCase();
        switch (cat) {
            case 'academic':
            case 'workshop':
            case 'seminar':
            case 'tech':
                common.push(
                    { id: 'rollNo', name: 'rollNo', label: 'Roll Number', type: 'text', required: true },
                    { id: 'class', name: 'class', label: 'Class', type: 'text', required: true },
                    { id: 'department', name: 'department', label: 'Department', type: 'text', required: true },
                    { id: 'year', name: 'year', label: 'Year of Study', type: 'select', options: ['1st Year','2nd Year','3rd Year','4th Year','Postgraduate','Faculty','Staff','Other'], required: true }
                );
                break;
            case 'sports':
                common.push(
                    { id: 'teamName', name: 'teamName', label: 'Team Name', type: 'text' },
                    { id: 'jerseyNumber', name: 'jerseyNumber', label: 'Jersey Number', type: 'text' }
                );
                break;
            case 'corporate':
            case 'wedding':
            case 'virtual':
            case 'exhibition':
                common.push(
                    { id: 'email', name: 'email', label: 'Email', type: 'email', required: true },
                    { id: 'company', name: 'company', label: 'Company/Organisation', type: 'text' },
                    { id: 'jobTitle', name: 'jobTitle', label: 'Job Title', type: 'text' }
                );
                break;
            case 'cultural':
            case 'social':
            case 'other':
                common.push({ id: 'email', name: 'email', label: 'Email', type: 'email' });
                break;
            default:
                common.push({ id: 'email', name: 'email', label: 'Email', type: 'email' });
                break;
        }
        common.push({ id: 'phone', name: 'phone', label: 'Phone Number', type: 'tel', required: true });
        return common;
    }

    const fields = getRegistrationFields(event.category);
    let formHtml = `
        <form id="registrationForm">
            <input type="hidden" name="eventId" value="${event._id}">
    `;

    fields.forEach(f => {
        let value = regData[f.name] || '';
        // normalize year numeric values if necessary
        if (f.name === 'year' && value && f.options && !f.options.includes(value)) {
            const numMap = {'1':'1st Year','2':'2nd Year','3':'3rd Year','4':'4th Year','5':'5th Year'};
            if (numMap[value]) value = numMap[value];
        }
        if (f.type === 'select') {
            formHtml += `<div class="form-group">
                <label for="${f.id}">${f.label}${f.required?' *':''}</label>
                <select id="${f.id}" name="${f.name}" ${f.required?'required':''}>
                    <option value="">Select</option>`;
            f.options.forEach(opt => {
                const sel = value === opt ? 'selected' : '';
                formHtml += `<option value="${opt}" ${sel}>${opt}</option>`;
            });
            formHtml += `</select></div>`;
        } else {
            formHtml += `<div class="form-group">
                <label for="${f.id}">${f.label}${f.required?' *':''}</label>
                <input type="${f.type}" id="${f.id}" name="${f.name}" value="${value}" ${f.required?'required':''} placeholder="${f.label}" />
            </div>`;
        }
    });

    // always include dietary and specialNeeds at end
    formHtml += `
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

    // Only show epass option if event creator enabled it
    if (event.enableEPass) {
        formHtml += `
            <div class="form-group epass-toggle-group">
                <label for="wantsEPass">E-Pass Request</label>
                <div class="epass-toggle-container">
                    <input type="checkbox" id="wantsEPass" name="wantsEPass" class="epass-toggle-input" ${regData.wantsEPass ? 'checked' : ''}>
                    <label for="wantsEPass" class="epass-toggle-label">
                        <span class="toggle-text-off">Not Needed</span>
                        <span class="toggle-text-on">Requested</span>
                    </label>
                </div>
                <p class="epass-toggle-hint">Toggle to request an electronic pass for this event</p>
            </div>
        `;
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
        showLoader('Submitting registration...');
        const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        hideLoader();
        console.log('Registration submission response:', result);

        if (response.ok) {
            toast.success(result.message);
            closeRegistrationModal();
            // Refresh both views to show the registration
            window.loadEvents();
            window.loadRegisteredEvents();
        } else {
            toast.error('Error: ' + result.message);
        }
    } catch (error) {
        hideLoader();
        console.error('Error submitting registration:', error);
        toast.error('An error occurred while submitting registration.');
    }
}

// Comprehensive Diagnostics Function
window.runDiagnostics = async function() {
    const debugOutput = document.getElementById('debugOutput');
    debugOutput.style.display = 'block';
    debugOutput.textContent = 'Running diagnostics...';
    
    let output = '=== DASHBOARD DIAGNOSTICS ===\n\n';
    
    try {
        // 1. Check current user
        output += '1. CURRENT USER INFO:\n';
        output += `   - Username: ${currentUser?.username || 'NOT SET'}\n`;
        output += `   - User ID: ${currentUser?._id || currentUser?.userId || 'NOT SET'}\n`;
        output += `   - College: ${currentUser?.collegeName || 'NOT SET'}\n`;
        output += `   - Role: ${currentUser?.role || 'NOT SET'}\n`;
        output += `   - Email: ${currentUser?.email || 'NOT SET'}\n\n`;
        
        // 2. Check token
        output += '2. AUTHENTICATION:\n';
        const token = localStorage.getItem('token');
        output += `   - Token present: ${token ? 'YES' : 'NO'}\n`;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                output += `   - Token User ID: ${payload._id || payload.id || 'UNKNOWN'}\n`;
                output += `   - Token Expiry: ${new Date(payload.exp * 1000).toLocaleString()}\n`;
            } catch (e) {
                output += `   - Token decode error: ${e.message}\n`;
            }
        }
        output += '\n';
        
        // 3. Check API connectivity
        output += '3. API CONNECTIVITY:\n';
        try {
            const testRes = await fetch(`${API_BASE}/test`);
            output += `   - API Base: ${API_BASE}\n`;
            output += `   - API Health: ${testRes.ok ? 'OK' : 'ERROR'}\n`;
        } catch (e) {
            output += `   - API Health: ERROR - ${e.message}\n`;
        }
        output += '\n';
        
        // 4. Test /events/registered endpoint
        output += '4. REGISTERED EVENTS ENDPOINT:\n';
        try {
            const regRes = await fetch(`${API_BASE}/events/registered`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            output += `   - Status: ${regRes.status} ${regRes.statusText}\n`;
            const regData = await regRes.json();
            output += `   - Response Type: ${Array.isArray(regData) ? 'ARRAY' : 'OBJECT'}\n`;
            output += `   - Count: ${Array.isArray(regData) ? regData.length : 'N/A (not array)'}\n`;
            if (Array.isArray(regData) && regData.length > 0) {
                output += `   - Events:\n`;
                regData.forEach((e, i) => {
                    output += `     ${i+1}. ${e.title} (ID: ${e._id})\n`;
                });
            } else if (Array.isArray(regData)) {
                output += `   - No events returned (empty array)\n`;
            } else {
                output += `   - Unexpected response format\n`;
            }
        } catch (e) {
            output += `   - Error: ${e.message}\n`;
        }
        output += '\n';
        
        // 5. Test participant collection check
        output += '5. PARTICIPANT RECORDS CHECK:\n';
        try {
            const partRes = await fetch(`${API_BASE}/events/debug/participants-check`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (partRes.ok) {
                const partData = await partRes.json();
                output += `   - Status: OK\n`;
                output += `   - Current User Participants: ${partData.currentUserParticipants}\n`;
                output += `   - Total Tenant Participants: ${partData.totalParticipantsInTenant}\n`;
                output += `   - Tenant ID: ${partData.currentUser?.tenantId || 'NOT SET'}\n`;
                if (partData.currentUserParticipantsList && partData.currentUserParticipantsList.length > 0) {
                    output += `   - Events registered:\n`;
                    partData.currentUserParticipantsList.forEach((p, i) => {
                        output += `     ${i+1}. ${p.event?.title} (registered at ${new Date(p.registeredAt).toLocaleString()})\n`;
                    });
                } else {
                    output += `   - ❌ NO PARTICIPANT RECORDS FOUND\n`;
                    output += `      This means you haven't registered for any events yet.\n`;
                }
            } else {
                output += `   - Error: ${partRes.status}\n`;
            }
        } catch (e) {
            output += `   - Error: ${e.message}\n`;
        }
        output += '\n';
        
        // 6. Test /epasses/user/my-tickets endpoint
        output += '6. USER E-PASSES ENDPOINT:\n';
        try {
            const passRes = await fetch(`${API_BASE}/epasses/user/my-tickets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            output += `   - Status: ${passRes.status} ${passRes.statusText}\n`;
            if (passRes.ok) {
                const passData = await passRes.json();
                const count = Array.isArray(passData.tickets) ? passData.tickets.length : 'N/A';
                output += `   - Ticket count: ${count}\n`;
                if (count && count > 0) {
                    output += '   - Sample ticket titles:\n';
                    passData.tickets.slice(0,3).forEach((t,i)=>{
                        output += `     ${i+1}. ${t.eventTitle} (status: ${t.status})\n`;
                    });
                }
            } else {
                const errObj = await passRes.json().catch(()=>({}));
                output += `   - Error body: ${JSON.stringify(errObj)}\n`;
            }
        } catch(e) {
            output += `   - Exception: ${e.message}\n`;
        }
        output += '\n';
        
        // 7. Check All Events
        output += '7. ALL EVENTS:\n';
        try {
            const allRes = await fetch(`${API_BASE}/events`);
            const allData = await allRes.json();
            output += `   - Total Events: ${Array.isArray(allData) ? allData.length : 'ERROR'}\n`;
            if (Array.isArray(allData) && allData.length > 0) {
                output += `   - First 3 events:\n`;
                allData.slice(0, 3).forEach((e, i) => {
                    output += `     ${i+1}. ${e.title} (TenantID: ${e.tenantId || 'default'})\n`;
                });
            }
        } catch (e) {
            output += `   - Error: ${e.message}\n`;
        }
        output += '\n';
        
        // 7. Summary and Recommendations
        output += '7. SUMMARY & RECOMMENDATIONS:\n';
        if (!currentUser?.collegeName) {
            output += `   ⚠️  Your college name is not set.\n`;
            output += `      - Go to Profile tab and edit your college name.\n`;
        }
        if (!token) {
            output += `   ❌ You are not logged in!\n`;
        } else if (currentUser?.role !== 'student') {
            output += `   ⚠️  Your role is: ${currentUser?.role || 'UNKNOWN'}\n`;
            output += `      - Only students can register for events.\n`;
        }
        
        const regRes = await fetch(`${API_BASE}/events/registered`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const regData = await regRes.json();
        
        if (Array.isArray(regData) && regData.length === 0) {
            output += `   ℹ️  No registered events found.\n`;
            output += `      - Go to "Upcoming Events" tab and click "Register" on an event.\n`;
        }
        
        output += '\n=== END DIAGNOSTICS ===';
        
    } catch (error) {
        output += `\nFATAL ERROR: ${error.message}`;
    }
    
    debugOutput.textContent = output;
    console.log(output); // Also log to browser console
};

