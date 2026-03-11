// Global variable to store all events
let allEvents = [];

// Load events and display with registration functionality
document.addEventListener('DOMContentLoaded', async () => {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    try {
        const response = await fetch('http://localhost:3000/api/events');
        allEvents = await response.json();

        if (!response.ok) {
            eventsGrid.innerHTML = '<p>Failed to load events.</p>';
            return;
        }

        if (allEvents.length === 0) {
            eventsGrid.innerHTML = '<p>No upcoming events.</p>';
            document.getElementById('endedEventsGrid').innerHTML = '<p>No recently ended events.</p>';
            return;
        }

        // Render all events initially
        renderEvents(allEvents);

        // Setup search and filter listeners
        setupSearchAndFilters();
    } catch (error) {
        eventsGrid.innerHTML = '<p>Error loading events.</p>';
    }
});

// Function to render events
function renderEvents(eventsToRender) {
    const eventsGrid = document.getElementById('eventsGrid');
    const endedEventsGrid = document.getElementById('endedEventsGrid');
    
    if (!eventsToRender || eventsToRender.length === 0) {
        eventsGrid.innerHTML = '<p>No events found.</p>';
        endedEventsGrid.innerHTML = '<p>No recently ended events.</p>';
        return;
    }

    const now = new Date();
    let upcomingHTML = '';
    let endedHTML = '';

    // helper to build a card string (matches existing markup)
    // pass a boolean isEnded so we can adjust buttons and labels
    function cardMarkup(event, isEnded) {
        const d = new Date(event.date);
        const dateFull = d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const dateDay = d.getDate();
        const dateMonth = d.toLocaleDateString('en-US', { month: 'short' });

        let dateRange = dateFull;
        if (event.endDate) {
            const e = new Date(event.endDate);
            const endFull = e.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            dateRange += ' – ' + endFull;
        }

        const category = event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'Event';
        const imageUrl = event.image || 'https://via.placeholder.com/380x260/667eea/ffffff?text=Event+Image';
        const desc = event.description || '';
        const shortDesc = desc.length > 120 ? desc.substring(0, 120).trim() + '…' : desc;

        return `
            <article class="event-card">
                <div class="event-card-image-wrap">
                    <img src="${imageUrl}" alt="${event.title}" class="event-image" onerror="this.src='https://via.placeholder.com/380x260/667eea/ffffff?text=Event+Image'">
                    <div class="event-card-overlay"></div>
                    <span class="event-card-category">${category}</span>
                    <div class="event-card-date-badge">
                        <span class="event-card-day">${dateDay}</span>
                        <span class="event-card-month">${dateMonth}</span>
                    </div>
                </div>
                <div class="event-content">
                    <h3 class="event-card-title">${event.title}</h3>
                    <div class="event-meta">
                        <span class="event-meta-item"><i class="fas fa-calendar-alt"></i> ${dateRange}</span>
                        <span class="event-meta-item"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                        <span class="event-meta-item"><i class="fas fa-users"></i> ${event.participants ? event.participants.length : 0} participants</span>
                    </div>
                    <p class="event-description">${shortDesc}</p>
                    <div class="event-actions">
                        <button type="button" class="event-btn event-btn-outline" onclick="viewEvent('${event._id}')">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        ${isEnded ? `
                            <span class="event-ended-label">Event Ended</span>
                        ` : `
                            <button type="button" class="event-btn event-btn-primary" onclick="handleRegistration('${event._id}')">
                                <i class="fas fa-user-plus"></i> Register
                            </button>
                        `}
                    </div>
                </div>
            </article>
        `;
    }

    eventsToRender.forEach(event => {
        const end = event.endDate ? new Date(event.endDate) : null;
        const isEnded = end && end < now;
        if (isEnded) {
            endedHTML += cardMarkup(event, true);
        } else {
            // no end date or end in future: show as upcoming
            upcomingHTML += cardMarkup(event, false);
        }
    });

    eventsGrid.innerHTML = upcomingHTML || '<div class="no-results"><div class="no-results-icon"><i class="fas fa-search"></i></div><p>No upcoming events found.</p></div>';
    endedEventsGrid.innerHTML = endedHTML || '<p>No recently ended events.</p>';
}

// Function to setup search and filter listeners
function setupSearchAndFilters() {
    const searchInput = document.getElementById('eventSearchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', applySearchAndFilter);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applySearchAndFilter);
    }
}

// Function to apply search and filter
function applySearchAndFilter() {
    const searchInput = document.getElementById('eventSearchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value.toLowerCase().trim() : '';

    // Filter events based on search term and category
    const filteredEvents = allEvents.filter(event => {
        // Check if event matches search term (search in title, description, and location)
        const matchesSearch = !searchTerm || 
            event.title.toLowerCase().includes(searchTerm) ||
            (event.description && event.description.toLowerCase().includes(searchTerm)) ||
            (event.location && event.location.toLowerCase().includes(searchTerm));

        // Check if event matches selected category
        const matchesCategory = !selectedCategory || 
            (event.category && event.category.toLowerCase() === selectedCategory);

        return matchesSearch && matchesCategory;
    });

    // Render filtered events
    renderEvents(filteredEvents);
}

// determine which fields to show for registration based on category
function getRegistrationFields(category) {
    const common = [
        { id: 'regStudentName', name: 'studentName', label: 'Name', type: 'text', required: true },
    ];
    const cat = (category || '').toLowerCase();

    switch (cat) {
        case 'academic':
        case 'workshop':
        case 'seminar':
        case 'tech':
            common.push(
                { id: 'regRollNo', name: 'rollNo', label: 'Roll Number', type: 'text', required: true },
                { id: 'regClass', name: 'class', label: 'Class', type: 'text', required: true },
                { id: 'regDepartment', name: 'department', label: 'Department', type: 'text', required: true },
                { id: 'regYear', name: 'year', label: 'Year of Study', type: 'select', options: ['1st Year','2nd Year','3rd Year','4th Year','Postgraduate','Faculty','Staff','Other'], required: true }
            );
            break;
        case 'sports':
            common.push(
                { id: 'regTeamName', name: 'teamName', label: 'Team Name', type: 'text' },
                { id: 'regJerseyNumber', name: 'jerseyNumber', label: 'Jersey Number', type: 'text' }
            );
            break;
        case 'corporate':
        case 'wedding':
        case 'virtual':
        case 'exhibition':
            common.push(
                { id: 'regEmail', name: 'email', label: 'Email', type: 'email', required: true },
                { id: 'regCompany', name: 'company', label: 'Company/Organisation', type: 'text' },
                { id: 'regJobTitle', name: 'jobTitle', label: 'Job Title', type: 'text' }
            );
            break;
        case 'cultural':
        case 'social':
        case 'other':
            common.push({ id: 'regEmail', name: 'email', label: 'Email', type: 'email' });
            break;
        default:
            common.push({ id: 'regEmail', name: 'email', label: 'Email', type: 'email' });
            break;
    }
    // after category-specific fields always add phone at end
    common.push({ id: 'regPhone', name: 'phone', label: 'Phone Number', type: 'tel', required: true });
    return common;
}

// Handle event registration
async function handleRegistration(eventId) {
    const token = localStorage.getItem('token');

    if (!token) {
        // User is not logged in, redirect to login
        toast.warning('You need to be logged in to register.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Show registration form modal
    showRegistrationModal(eventId);
}

// Show registration form modal
async function showRegistrationModal(eventId) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('registrationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'registrationModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content registration-modal-content">
                <span class="close" onclick="closeRegistrationModal()">&times;</span>
                <div id="registrationFormContent">
                    <div class="loading">Loading registration form...</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add modal styles if not already present
        if (!document.getElementById('registration-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'registration-modal-styles';
            style.textContent = `
                .registration-modal-content {
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                .registration-form h3 {
                    color: #333;
                    margin-bottom: 1.5rem;
                    font-size: 1.5rem;
                    font-weight: 700;
                    text-align: center;
                }
                .registration-form .form-group {
                    margin-bottom: 1rem;
                }
                .registration-form .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #333;
                    font-size: 0.9rem;
                }
                .registration-form .form-group input,
                .registration-form .form-group select,
                .registration-form .form-group textarea {
                    width: 100%;
                    padding: 0.8rem;
                    border: 2px solid #e1e8ed;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    background-color: #f8f9fa;
                    font-family: inherit;
                }
                .registration-form .form-group input:focus,
                .registration-form .form-group select:focus,
                .registration-form .form-group textarea:focus {
                    outline: none;
                    border-color: #4f46e5;
                    background-color: white;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }
                .registration-form .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .registration-form .checkbox-group input[type="checkbox"] {
                    width: auto;
                    margin: 0;
                }
                .registration-form .checkbox-group label {
                    margin: 0;
                    font-weight: normal;
                    cursor: pointer;
                }
                .registration-form .radio-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .registration-form .radio-option {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .registration-form .radio-option input[type="radio"] {
                    width: auto;
                    margin: 0;
                }
                .registration-form .radio-option label {
                    margin: 0;
                    font-weight: normal;
                    cursor: pointer;
                }
                .registration-form .checkbox-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .registration-form .checkbox-option {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .registration-form .checkbox-option input[type="checkbox"] {
                    width: auto;
                    margin: 0;
                }
                .registration-form .checkbox-option label {
                    margin: 0;
                    font-weight: normal;
                    cursor: pointer;
                }
                .registration-form .form-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }
                .registration-form .btn-secondary,
                .registration-form .btn-outline {
                    flex: 1;
                    padding: 0.8rem 1rem;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                .registration-form .btn-secondary {
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    color: white;
                }
                .registration-form .btn-secondary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                }
                .registration-form .btn-outline {
                    background: transparent;
                    border: 2px solid #6b7280;
                    color: #6b7280;
                }
                .registration-form .btn-outline:hover {
                    background: #6b7280;
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }
    }

    modal.style.display = 'block';

    try {
        // Fetch event details to get custom questions
        const response = await fetch(`http://localhost:3000/api/events/${eventId}`);
        const event = await response.json();

        if (!response.ok) {
            document.getElementById('registrationFormContent').innerHTML = '<p>Error loading event details.</p>';
            return;
        }

        // Determine fields for this event category
        const fields = getRegistrationFields(event.category);
        
        // If event has e-pass enabled, ensure email is required
        let hasEmail = fields.some(f => f.name === 'email');
        if (event.enableEPass && !hasEmail) {
            fields.push({ id: 'regEmail', name: 'email', label: 'Email', type: 'email', required: true });
        } else if (event.enableEPass && hasEmail) {
            // Make email required if e-pass is enabled
            const emailField = fields.find(f => f.name === 'email');
            if (emailField) emailField.required = true;
        }
        
        // build html for fields
        let fieldHtml = '';
        fields.forEach(f => {
            if (f.type === 'select') {
                const opts = f.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                fieldHtml += `
                    <div class="form-group">
                        <label for="${f.id}">${f.label}${f.required? ' *':''}</label>
                        <select id="${f.id}" name="${f.name}" ${f.required? 'required':''}>
                            <option value="">Select</option>
                            ${opts}
                        </select>
                    </div>
                `;
            } else {
                fieldHtml += `
                    <div class="form-group">
                        <label for="${f.id}">${f.label}${f.required? ' *':''}</label>
                        <input type="${f.type}" id="${f.id}" name="${f.name}" ${f.required? 'required':''} placeholder="${f.label}" />
                    </div>
                `;
            }
        });

        // Generate custom question fields
        let customFields = '';
        if (event.customQuestions && event.customQuestions.length > 0) {
            customFields = event.customQuestions.map(question => {
                const fieldName = `custom_${question._id}`;
                let fieldHtml = '';

                switch (question.type) {
                    case 'text':
                        fieldHtml = `
                            <div class="form-group">
                                <label for="${fieldName}">${question.question}</label>
                                <input type="text" id="${fieldName}" name="${fieldName}" placeholder="Enter your answer">
                            </div>
                        `;
                        break;
                    case 'textarea':
                        fieldHtml = `
                            <div class="form-group">
                                <label for="${fieldName}">${question.question}</label>
                                <textarea id="${fieldName}" name="${fieldName}" rows="3" placeholder="Enter your answer"></textarea>
                            </div>
                        `;
                        break;
                    case 'select':
                        const selectOptions = question.options.map(option =>
                            `<option value="${option}">${option}</option>`
                        ).join('');
                        fieldHtml = `
                            <div class="form-group">
                                <label for="${fieldName}">${question.question}</label>
                                <select id="${fieldName}" name="${fieldName}">
                                    <option value="">Select an option</option>
                                    ${selectOptions}
                                </select>
                            </div>
                        `;
                        break;
                    case 'radio':
                        const radioOptions = question.options.map(option => `
                            <div class="radio-option">
                                <input type="radio" id="${fieldName}_${option}" name="${fieldName}" value="${option}">
                                <label for="${fieldName}_${option}">${option}</label>
                            </div>
                        `).join('');
                        fieldHtml = `
                            <div class="form-group">
                                <label>${question.question}</label>
                                <div class="radio-group">
                                    ${radioOptions}
                                </div>
                            </div>
                        `;
                        break;
                    case 'checkbox':
                        const checkboxOptions = question.options.map(option => `
                            <div class="checkbox-option">
                                <input type="checkbox" id="${fieldName}_${option}" name="${fieldName}" value="${option}">
                                <label for="${fieldName}_${option}">${option}</label>
                            </div>
                        `).join('');
                        fieldHtml = `
                            <div class="form-group">
                                <label>${question.question}</label>
                                <div class="checkbox-list">
                                    ${checkboxOptions}
                                </div>
                            </div>
                        `;
                        break;
                }
                return fieldHtml;
            }).join('');
        }

        // E-Pass checkbox section (only if event enables e-pass)
        let epassSection = '';
        if (event.enableEPass) {
            epassSection = `
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="regEPass" name="wantsEPass">
                    <label for="regEPass">I want to receive an E-Pass for this event (🎫 Digital Entry Pass)</label>
                </div>
                <p style="font-size: 0.85rem; color: #666; margin-top: -0.5rem; margin-bottom: 1rem;">The E-Pass will be sent to your email address. Email is required for this option.</p>
            `;
        }

        const formContent = `
            <form class="registration-form" id="eventRegistrationForm">
                <h3>Register for ${event.title}</h3>

                ${fieldHtml}

                <div class="form-group">
                    <label for="regDietary">Dietary Preferences (Optional)</label>
                    <select id="regDietary" name="dietary">
                        <option value="">No dietary restrictions</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Halal">Halal</option>
                        <option value="Kosher">Kosher</option>
                        <option value="Gluten Free">Gluten Free</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="regSpecialNeeds">Special Requirements (Optional)</label>
                    <textarea id="regSpecialNeeds" name="specialNeeds" rows="3" placeholder="Any special requirements or accessibility needs..."></textarea>
                </div>

                ${customFields}

                ${epassSection}

                <div class="form-group checkbox-group">
                    <input type="checkbox" id="regTerms" name="termsAccepted" required>
                    <label for="regTerms">I agree to the event terms and conditions</label>
                </div>

                <div class="form-group checkbox-group">
                    <input type="checkbox" id="regUpdates" name="receiveUpdates">
                    <label for="regUpdates">I would like to receive updates about this event</label>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-outline" onclick="closeRegistrationModal()">Cancel</button>
                    <button type="submit" class="btn-secondary">Register for Event</button>
                </div>
            </form>
        `;

        document.getElementById('registrationFormContent').innerHTML = formContent;

        // Add form submission handler
        document.getElementById('eventRegistrationForm').addEventListener('submit', function(e) {
            e.preventDefault();
            submitRegistration(eventId);
        });

    } catch (error) {
        console.error('Error loading event details:', error);
        document.getElementById('registrationFormContent').innerHTML = '<p>Error loading registration form.</p>';
    }
}

// Close registration modal
function closeRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Submit registration
async function submitRegistration(eventId) {
    const token = localStorage.getItem('token');
    if (!token) {
        toast.error('You need to be logged in to register.');
        return;
    }

    const form = document.getElementById('eventRegistrationForm');
    const formData = new FormData(form);

    // Collect basic registration data
    // gather all non-custom values automatically
    const registrationData = {};
    formData.forEach((value, key) => {
        if (key.startsWith('custom_')) return;
        if (key === 'termsAccepted' || key === 'receiveUpdates' || key === 'wantsEPass') return;
        registrationData[key] = value;
    });
    registrationData.termsAccepted = formData.has('termsAccepted');
    registrationData.receiveUpdates = formData.has('receiveUpdates');
    registrationData.wantsEPass = formData.has('wantsEPass');

    // Collect custom question answers
    const customFields = {};
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('custom_')) {
            const questionId = key.replace('custom_', '');
            if (customFields[questionId]) {
                // Handle multiple values (checkboxes)
                if (Array.isArray(customFields[questionId])) {
                    customFields[questionId].push(value);
                } else {
                    customFields[questionId] = [customFields[questionId], value];
                }
            } else {
                customFields[questionId] = value;
            }
        }
    }

    // Add custom answers to registration data
    Object.keys(customFields).forEach(questionId => {
        registrationData[`custom_${questionId}`] = customFields[questionId];
    });

    try {
        const response = await fetch(`http://localhost:3000/api/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(registrationData)
        });

        const result = await response.json();

        if (response.ok) {
            toast.success(result.message);
            closeRegistrationModal();
            // Optionally refresh the page or update the button state
            setTimeout(() => location.reload(), 2000);
        } else {
            toast.error('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        toast.error('An error occurred while registering for the event.');
    }
}

// View event details
async function viewEvent(eventId) {
    try {
        const response = await fetch(`http://localhost:3000/api/events/${eventId}`);
        const event = await response.json();

        if (response.ok) {
            showEventModal(event);
        } else {
            toast.error('Error loading event details');
        }
    } catch (error) {
        console.error('Error:', error);
        toast.error('Error loading event details');
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

    // determine if event has already ended
    const now = new Date();
    const end = event.endDate ? new Date(event.endDate) : null;
    const isEnded = end && end < now;

    // participants info
    const participantCount = event.participants ? event.participants.length : 0;
    let participantsHtml = `<p><strong><i class="fas fa-users"></i> Participants:</strong> ${participantCount}</p>`;

    if (isEnded && participantCount > 0) {
        participantsHtml += `<details style="margin-top:10px;"><summary>View attendee list</summary><ul style="max-height:200px;overflow:auto;padding-left:1.2rem;">
            ${event.participants.map(p => `<li>${p.user?.username || p.registrationData?.studentName || 'User'}</li>`).join('')}
        </ul></details>`;
    }

    const modalContent = `
        <h3>${event.title}</h3>
        <img src="${event.image || 'https://via.placeholder.com/400x250/667eea/ffffff?text=Event+Image'}" alt="${event.title}" style="max-width: 100%; height: auto; margin: 15px 0;">
        <div style="text-align: left; margin-bottom: 20px;">
            <p><strong><i class="fas fa-calendar-alt"></i> Date:</strong> ${date}</p>
            <p><strong><i class="fas fa-map-marker-alt"></i> Location:</strong> ${event.location}</p>
            <p><strong><i class="fas fa-tag"></i> Category:</strong> ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
            <p><strong><i class="fas fa-users"></i> Max Attendees:</strong> ${event.maxAttendees || 'Unlimited'}</p>
            ${participantsHtml}
        </div>
        <p><strong>Description:</strong></p>
        <p style="margin-bottom: 20px; line-height: 1.6;">${event.description}</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            ${isEnded ? '' : `<button class="btn-secondary" onclick="handleRegistration('${event._id}'); closeModal();">
                <i class="fas fa-user-plus"></i> Register
            </button>`}
            <button class="btn-outline" onclick="closeModal()">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;

    // Create modal if it doesn't exist
    let modal = document.getElementById('eventModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'eventModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <div id="eventDetails"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add modal styles if not already present
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                }
                .modal-content {
                    background-color: white;
                    margin: 5% auto;
                    padding: 20px;
                    border-radius: 10px;
                    width: 90%;
                    max-width: 600px;
                    position: relative;
                }
                .close {
                    position: absolute;
                    right: 20px;
                    top: 15px;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    color: #aaa;
                }
                .close:hover {
                    color: #000;
                }
                .btn-outline {
                    background: transparent;
                    border: 2px solid #667eea;
                    color: #667eea;
                }
                .btn-outline:hover {
                    background: #667eea;
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }
    }

    document.getElementById('eventDetails').innerHTML = modalContent;
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('eventModal');
    if (event.target === modal) {
        closeModal();
    }
}
