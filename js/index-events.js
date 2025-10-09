// Load events and display with registration functionality
document.addEventListener('DOMContentLoaded', async () => {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    try {
        const response = await fetch('http://localhost:3000/api/events');
        const events = await response.json();

        if (!response.ok) {
            eventsGrid.innerHTML = '<p>Failed to load events.</p>';
            return;
        }

        if (events.length === 0) {
            eventsGrid.innerHTML = '<p>No upcoming events.</p>';
            return;
        }

        eventsGrid.innerHTML = events.map(event => {
            const date = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const category = event.category.charAt(0).toUpperCase() + event.category.slice(1);
            const imageUrl = event.image || 'https://via.placeholder.com/380x220/667eea/ffffff?text=Event+Image';

            return `
                <div class="event-card">
                    <img src="${imageUrl}" alt="${event.title}" class="event-image" onerror="this.src='https://via.placeholder.com/380x220/667eea/ffffff?text=Event+Image'">
                    <div class="event-content">
                        <h4>${event.title}</h4>
                        <div class="event-meta">
                            <div class="event-meta-item">
                                <i class="fas fa-calendar-alt"></i>
                                <span>${date}</span>
                            </div>
                            <div class="event-meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${event.location}</span>
                            </div>
                            <div class="event-meta-item">
                                <i class="fas fa-tag"></i>
                                <span>${category}</span>
                            </div>
                        </div>
                        <p class="event-description">${event.description}</p>
                        <div class="event-actions">
                            <button class="btn-secondary" onclick="viewEvent('${event._id}')">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                            <button class="btn-secondary" onclick="handleRegistration('${event._id}')">
                                <i class="fas fa-user-plus"></i> Register
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        eventsGrid.innerHTML = '<p>Error loading events.</p>';
    }
});

// Handle event registration
async function handleRegistration(eventId) {
    const token = localStorage.getItem('token');

    if (!token) {
        // User is not logged in, redirect to login
        if (confirm('You need to be logged in to register for events. Would you like to log in now?')) {
            window.location.href = 'login.html';
        }
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

        const formContent = `
            <form class="registration-form" id="eventRegistrationForm">
                <h3>Register for ${event.title}</h3>

                <div class="form-group">
                    <label for="regStudentName">Student Name</label>
                    <input type="text" id="regStudentName" name="studentName" placeholder="Enter your full name" required>
                </div>

                <div class="form-group">
                    <label for="regRollNo">Roll Number</label>
                    <input type="text" id="regRollNo" name="rollNo" placeholder="Enter your roll number" required>
                </div>

                <div class="form-group">
                    <label for="regClass">Class</label>
                    <input type="text" id="regClass" name="class" placeholder="Enter your class (e.g., FYBCA, SYBCA)" required>
                </div>

                <div class="form-group">
                    <label for="regPhone">Phone Number</label>
                    <input type="tel" id="regPhone" name="phone" placeholder="Enter your phone number" required>
                </div>

                <div class="form-group">
                    <label for="regDepartment">Department</label>
                    <input type="text" id="regDepartment" name="department" placeholder="Your department" required>
                </div>

                <div class="form-group">
                    <label for="regYear">Year of Study</label>
                    <select id="regYear" name="year" required>
                        <option value="">Select year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Postgraduate">Postgraduate</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Staff">Staff</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

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
        alert('You need to be logged in to register.');
        return;
    }

    const form = document.getElementById('eventRegistrationForm');
    const formData = new FormData(form);

    // Collect basic registration data
    const registrationData = {
        studentName: formData.get('studentName'),
        rollNo: formData.get('rollNo'),
        class: formData.get('class'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        year: formData.get('year'),
        dietary: formData.get('dietary') || null,
        specialNeeds: formData.get('specialNeeds') || null,
        termsAccepted: formData.has('termsAccepted'),
        receiveUpdates: formData.has('receiveUpdates')
    };

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
            alert(result.message);
            closeRegistrationModal();
            // Optionally refresh the page or update the button state
            location.reload();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while registering for the event.');
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

    const modalContent = `
        <h3>${event.title}</h3>
        <img src="${event.image || 'https://via.placeholder.com/400x250/667eea/ffffff?text=Event+Image'}" alt="${event.title}" style="max-width: 100%; height: auto; margin: 15px 0;">
        <div style="text-align: left; margin-bottom: 20px;">
            <p><strong><i class="fas fa-calendar-alt"></i> Date:</strong> ${date}</p>
            <p><strong><i class="fas fa-map-marker-alt"></i> Location:</strong> ${event.location}</p>
            <p><strong><i class="fas fa-tag"></i> Category:</strong> ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
            <p><strong><i class="fas fa-users"></i> Max Attendees:</strong> ${event.maxAttendees || 'Unlimited'}</p>
        </div>
        <p><strong>Description:</strong></p>
        <p style="margin-bottom: 20px; line-height: 1.6;">${event.description}</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn-secondary" onclick="handleRegistration('${event._id}'); closeModal();">
                <i class="fas fa-user-plus"></i> Register
            </button>
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
