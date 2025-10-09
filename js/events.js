// Load events from API
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE}/events`);
        const events = await response.json();

        if (response.ok) {
            // Sort events by creation date descending to show newest first
            events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            displayEvents(events);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Display events
function displayEvents(events) {
    const eventsContainer = document.querySelector('.events-grid');
    if (!eventsContainer) return;

    eventsContainer.innerHTML = '';

    events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-card';

        const date = new Date(event.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        eventDiv.innerHTML = `
            <img src="${event.image}" alt="${event.title}" class="event-image">
            <div class="event-content">
                <h3>${event.title}</h3>
                <p class="event-date">📅 ${date}</p>
                <p>📍 ${event.location}</p>
                <p>${event.description}</p>
            </div>
        `;

        eventsContainer.appendChild(eventDiv);
    });
}

// Load events and display with buttons that redirect to login page
async function loadEventsWithActions() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    try {
        const response = await fetch(`${API_BASE}/events`);
        const events = await response.json();

        if (!response.ok) {
            eventsGrid.innerHTML = '<p>Failed to load events.</p>';
            return;
        }

        if (events.length === 0) {
            eventsGrid.innerHTML = '<p>No upcoming events.</p>';
            return;
        }

        const token = getToken();
        const isLoggedIn = !!token;

        eventsGrid.innerHTML = events.map(event => {
            const date = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const registerButton = isLoggedIn
                ? `<button class="btn-secondary" onclick="registerForEvent('${event._id}')">Register</button>`
                : `<button class="btn-secondary" onclick="window.location.href='login.html'">Login to Register</button>`;

            const detailsButton = isLoggedIn
                ? `<button class="btn-secondary" onclick="viewEventDetails('${event._id}')">More Details</button>`
                : `<button class="btn-secondary" onclick="window.location.href='login.html'">Login for Details</button>`;

            return `
                <div class="event-card">
                    <h4>${event.title}</h4>
                    <p class="event-date">📅 ${date}</p>
                    <p class="event-location">📍 ${event.location}</p>
                    <p>🏷️ ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
                    <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                    <div class="event-actions">
                        ${registerButton}
                        ${detailsButton}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        eventsGrid.innerHTML = '<p>Error loading events.</p>';
    }
}

// Function to register for an event
async function registerForEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                // Add registration data if needed, but for now assume minimal
                studentName: 'Test', // This should be from user profile
                rollNo: '123',
                class: 'Test',
                phone: '1234567890',
                department: 'Test',
                year: '2023',
                termsAccepted: true
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Successfully registered for the event!');
        } else {
            alert('Registration failed: ' + result.message);
        }
    } catch (error) {
        console.error('Error registering for event:', error);
        alert('An error occurred while registering.');
    }
}

// Function to view event details
async function viewEventDetails(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const event = await response.json();

        if (response.ok) {
            // Display event details in a modal or alert for now
            alert(`Event Details:\n\nTitle: ${event.title}\nDate: ${new Date(event.date).toLocaleString()}\nLocation: ${event.location}\nDescription: ${event.description}`);
        } else {
            alert('Failed to load event details.');
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        alert('An error occurred while loading details.');
    }
}

// Event filtering functionality
function setupEventFiltering() {
    const eventsSection = document.querySelector('.events-section');
    if (eventsSection) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        filterContainer.innerHTML = `
            <input type="text" id="eventFilter" placeholder="Search events..." class="filter-input">
        `;

        const container = eventsSection.querySelector('.container');
        if (container) {
            const sectionTitle = container.querySelector('.section-title');
            if (sectionTitle && sectionTitle.parentNode === container) {
                container.insertBefore(filterContainer, sectionTitle.nextSibling);
            } else {
                // If no section title or sectionTitle is not a child of container, just append to container
                container.appendChild(filterContainer);
            }
        }

        const filterInput = document.getElementById('eventFilter');
        filterInput.addEventListener('input', () => {
            const filterValue = filterInput.value.toLowerCase();
            const events = document.querySelectorAll('.event-card');

            events.forEach(event => {
                const text = event.textContent.toLowerCase();
                if (text.includes(filterValue)) {
                    event.style.display = '';
                } else {
                    event.style.display = 'none';
                }
            });
        });
    }
}

// Initialize events on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Load events if on index page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadEvents();
        setupEventFiltering();
    }

    // Load events with actions for student pages
    if (document.getElementById('eventsGrid')) {
        loadEventsWithActions();
    }
});
