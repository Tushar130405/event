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
            toast.success('Successfully registered for the event!');
            
            // Show E-Pass popup if enabled
            if (result.showEPassPopup) {
                showEPassPopup(result.participantId, result.eventId, result.userEmail);
            }
        } else {
            toast.error('Registration failed: ' + result.message);
        }
    } catch (error) {
        console.error('Error registering for event:', error);
        toast.error('An error occurred while registering.');
    }
}

// Function to show E-Pass popup after registration
function showEPassPopup(participantId, eventId, userEmail) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('epassModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'epassModal';
        modal.className = 'epass-modal';
        modal.innerHTML = `
            <div class="epass-modal-content">
                <button class="epass-modal-close" onclick="closeEPassPopup()">&times;</button>
                <div class="epass-modal-header">
                    <h2>🎫 Get Your E-Pass</h2>
                </div>
                <div class="epass-modal-body">
                    <p>Would you like your event E-Pass sent to your email?</p>
                    <p class="epass-email-display">Email: <strong id="epassEmailText"></strong></p>
                    <p class="epass-info">Your E-Pass will contain:</p>
                    <ul class="epass-features">
                        <li>🎟️ Digital admission ticket</li>
                        <li>📱 QR code for entry</li>
                        <li>📅 Event details</li>
                        <li>📍 Venue information</li>
                    </ul>
                </div>
                <div class="epass-modal-actions">
                    <button id="epassSendBtn" class="btn-primary">Send E-Pass to Email</button>
                    <button id="epassSkipBtn" class="btn-secondary">Skip for Now</button>
                </div>
                <div id="epassMessage" class="epass-message" style="display:none;"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add styles if not already present
        if (!document.getElementById('epassModalStyles')) {
            const styles = document.createElement('style');
            styles.id = 'epassModalStyles';
            styles.innerHTML = `
                .epass-modal {
                    display: flex;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.6);
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                
                .epass-modal-content {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
                    max-width: 500px;
                    width: 90%;
                    padding: 40px;
                    position: relative;
                    animation: slideIn 0.3s ease-out;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .epass-modal-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #999;
                    transition: color 0.2s;
                }
                
                .epass-modal-close:hover {
                    color: #333;
                }
                
                .epass-modal-header {
                    text-align: center;
                    margin-bottom: 25px;
                }
                
                .epass-modal-header h2 {
                    color: #667eea;
                    font-size: 26px;
                    margin: 0;
                }
                
                .epass-modal-body {
                    margin-bottom: 25px;
                }
                
                .epass-modal-body p {
                    margin: 12px 0;
                    color: #333;
                    font-size: 15px;
                    line-height: 1.5;
                }
                
                .epass-email-display {
                    background: #f5f5f5;
                    padding: 12px 15px;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                }
                
                .epass-info {
                    font-weight: 600;
                    color: #667eea;
                    margin-top: 20px !important;
                }
                
                .epass-features {
                    list-style: none;
                    padding: 15px;
                    background: #f9f9f9;
                    border-radius: 8px;
                    margin: 12px 0;
                }
                
                .epass-features li {
                    padding: 8px 0;
                    color: #555;
                    font-size: 14px;
                }
                
                .epass-modal-actions {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 15px;
                }
                
                .epass-modal-actions button {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .epass-modal-actions .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .epass-modal-actions .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
                }
                
                .epass-modal-actions .btn-primary:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .epass-modal-actions .btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                    border: 1px solid #ddd;
                }
                
                .epass-modal-actions .btn-secondary:hover {
                    background: #e8e8e8;
                }
                
                .epass-message {
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                }
                
                .epass-message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .epass-message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                @media (max-width: 600px) {
                    .epass-modal-content {
                        padding: 30px 20px;
                        width: 95%;
                    }
                    
                    .epass-modal-header h2 {
                        font-size: 22px;
                    }
                    
                    .epass-modal-actions {
                        flex-direction: column;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    // Update email and show modal
    document.getElementById('epassEmailText').textContent = userEmail || 'your-email@example.com';
    modal.style.display = 'flex';
    
    // Set up event handlers
    const sendBtn = document.getElementById('epassSendBtn');
    const skipBtn = document.getElementById('epassSkipBtn');
    
    // Remove old handlers
    const newSendBtn = sendBtn.cloneNode(true);
    const newSkipBtn = skipBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);
    
    // Add new handlers
    document.getElementById('epassSendBtn').addEventListener('click', () => {
        sendEPassForRegistration(participantId, eventId);
    });
    
    document.getElementById('epassSkipBtn').addEventListener('click', () => {
        closeEPassPopup();
    });
}

// Function to send E-Pass via the new endpoint
async function sendEPassForRegistration(participantId, eventId) {
    const sendBtn = document.getElementById('epassSendBtn');
    const messageEl = document.getElementById('epassMessage');
    
    try {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        messageEl.style.display = 'none';
        
        const response = await fetch(`${API_BASE}/epasses/send-for-registration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                participantId,
                eventId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            messageEl.className = 'epass-message success';
            messageEl.textContent = '✓ E-Pass sent successfully! Check your email.';
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                closeEPassPopup();
            }, 2500);
        } else {
            messageEl.className = 'epass-message error';
            messageEl.textContent = `Error: ${result.error || 'Failed to send E-Pass'}`;
            messageEl.style.display = 'block';
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send E-Pass to Email';
        }
    } catch (error) {
        console.error('Error sending E-Pass:', error);
        messageEl.className = 'epass-message error';
        messageEl.textContent = 'Error sending E-Pass. Please try again.';
        messageEl.style.display = 'block';
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send E-Pass to Email';
    }
}

// Function to close E-Pass popup
function closeEPassPopup() {
    const modal = document.getElementById('epassModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside of it
document.addEventListener('click', function(event) {
    const modal = document.getElementById('epassModal');
    if (modal && event.target === modal) {
        closeEPassPopup();
    }
});


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
            toast.info(`Event Details - Title: ${event.title}`); // Simplified message for toast
        } else {
            toast.error('Failed to load event details.');
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        toast.error('An error occurred while loading details.');
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
