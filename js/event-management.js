// API_BASE is declared in script.js

        // DOM Elements
        let currentUser = null;
        let currentTab = 'create';

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

            // Decode token to get user info (simple decode, in production use proper JWT library)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUser = payload;
                displayUserInfo();
                loadEvents();
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

            userRole.textContent = `Role: ${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}`;
            userCollege.textContent = `College: ${currentUser.collegeName || 'Not specified'}`;
        }

        // Setup event listeners
        function setupEventListeners() {
            // Event form submission
            document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
            document.getElementById('editEventForm').addEventListener('submit', handleEditSubmit);

            // Add custom question button
            const addQuestionBtn = document.getElementById('addCustomQuestionBtn');
            if (addQuestionBtn) {
                addQuestionBtn.addEventListener('click', addCustomQuestionField);
            }

            // Logout
            document.getElementById('logout-btn').addEventListener('click', handleLogout);

            // Mobile navigation
            const hamburger = document.querySelector('.hamburger');
            const navLinks = document.querySelector('.nav-links');

            if (hamburger && navLinks) {
                hamburger.addEventListener('click', () => {
                    navLinks.classList.toggle('active');
                    hamburger.classList.toggle('active');
                });
            }

            // Close mobile menu when clicking on a link
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                });
            });
        }

        // Handle event form submission
        async function handleEventSubmit(e) {
            e.preventDefault();

            const formData = new FormData(e.target);
            const tags = formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            const eventData = {
                title: formData.get('title'),
                date: formData.get('date'),
                location: formData.get('location'),
                category: formData.get('category'),
                description: formData.get('description'),
                image: formData.get('image') || 'https://via.placeholder.com/400x200?text=Event+Image',
                maxAttendees: formData.get('maxAttendees') ? parseInt(formData.get('maxAttendees')) : null,
                tags: tags,
                prerequisites: formData.get('prerequisites') || '',
                contactEmail: formData.get('contactEmail') || '',
                allowParticipation: formData.has('allowParticipation'),
                customQuestions: getCustomQuestionsFromForm(e.target)
            };

            try {
                const response = await fetch(`${API_BASE}/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(eventData)
                });

                const result = await response.json();

                if (response.ok) {
                    showMessage('message', 'Event created successfully!');
                    e.target.reset();
                    if (currentTab === 'manage') {
                        loadEvents();
                    }
                } else {
                    showMessage('message', 'Error creating event: ' + result.message, true);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while creating the event.');
            }
        }

        // Load events
        async function loadEvents() {
            const eventsList = document.getElementById('eventsList');

            try {
                const response = await fetch(`${API_BASE}/events`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const events = await response.json();

                if (response.ok) {
                    displayEvents(events);
                } else {
                    eventsList.innerHTML = '<div class="empty-state"><h4>Error loading events</h4><p>Please try again later.</p></div>';
                }
            } catch (error) {
                console.error('Error loading events:', error);
                eventsList.innerHTML = '<div class="empty-state"><h4>Error loading events</h4><p>Please check your connection and try again.</p></div>';
            }
        }

// Display events
function displayEvents(events) {
    const eventsList = document.getElementById('eventsList');

    // Filter events to show only those created by the current user
    const userEvents = events.filter(event => event.createdBy._id === currentUser._id);

    if (!userEvents || userEvents.length === 0) {
        eventsList.innerHTML = '<div class="empty-state"><h4>No events found</h4><p>You haven\'t created any events yet. Create your first event!</p></div>';
        return;
    }

    const eventsHTML = userEvents.map(event => {
        const date = new Date(event.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const participantCount = event.participants ? event.participants.length : 0;

        return `
            <div class="event-card">
                <h4>${event.title}</h4>
                <p class="event-date">📅 ${date}</p>
                <p class="event-location">📍 ${event.location}</p>
                <p>🏷️ ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
                <p>👥 Participants: ${participantCount}</p>
                <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                <div class="event-actions">
                    <button class="view-btn" onclick="viewParticipants('${event._id}')">View Participants</button>
                    <button class="edit-btn" onclick="editEvent('${event._id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteEvent('${event._id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');

    eventsList.innerHTML = `<div class="events-grid">${eventsHTML}</div>`;
}

        // Edit event
        function editEvent(eventId) {
            // Find event data (in a real app, you'd fetch this from the API)
            fetch(`${API_BASE}/events/${eventId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => response.json())
            .then(event => {
                document.getElementById('editEventId').value = event._id;
                document.getElementById('editEventTitle').value = event.title;
                document.getElementById('editEventDate').value = new Date(event.date).toISOString().slice(0, 16);
                document.getElementById('editEventLocation').value = event.location;
                document.getElementById('editEventCategory').value = event.category;
                document.getElementById('editEventImage').value = event.image;
                document.getElementById('editMaxAttendees').value = event.maxAttendees || '';
                document.getElementById('editEventDescription').value = event.description;
                document.getElementById('editEventTags').value = event.tags ? event.tags.join(', ') : '';
                document.getElementById('editPrerequisites').value = event.prerequisites || '';
                document.getElementById('editContactEmail').value = event.contactEmail || '';
                document.getElementById('editAllowParticipation').checked = event.allowParticipation || false;

                // Add scrolling class to modal content
                const modalContent = document.querySelector('#editModal .modal-content');
                if (modalContent) {
                    modalContent.classList.add('event-registration-form');
                }

                document.getElementById('editModal').style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching event:', error);
                alert('Error loading event details.');
            });
        }

        // Handle edit form submission
        async function handleEditSubmit(e) {
            e.preventDefault();

            const formData = new FormData(e.target);
            const eventId = formData.get('id');
            const tags = formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag) : [];

            const eventData = {
                title: formData.get('title'),
                date: formData.get('date'),
                location: formData.get('location'),
                category: formData.get('category'),
                description: formData.get('description'),
                image: formData.get('image'),
                maxAttendees: formData.get('maxAttendees') ? parseInt(formData.get('maxAttendees')) : null,
                tags: tags,
                prerequisites: formData.get('prerequisites') || '',
                contactEmail: formData.get('contactEmail') || '',
                allowParticipation: formData.has('allowParticipation')
            };

            try {
                const response = await fetch(`${API_BASE}/events/${eventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(eventData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Event updated successfully!');
                    closeModal();
                    loadEvents();
                } else {
                    alert('Error updating event: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while updating the event.');
            }
        }

        // Delete event
        async function deleteEvent(eventId) {
            if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/events/${eventId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    alert('Event deleted successfully!');
                    loadEvents();
                } else {
                    const result = await response.json();
                    alert('Error deleting event: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while deleting the event.');
            }
        }

        // Tab switching
        function showTab(tabName) {
            const createTab = document.getElementById('createTab');
            const manageTab = document.getElementById('manageTab');
            const createBtn = document.querySelector('.tab-btn:first-child');
            const manageBtn = document.querySelector('.tab-btn:last-child');

            if (tabName === 'create') {
                createTab.style.display = 'block';
                manageTab.style.display = 'none';
                createBtn.classList.add('active');
                manageBtn.classList.remove('active');
                currentTab = 'create';
            } else {
                createTab.style.display = 'none';
                manageTab.style.display = 'block';
                createBtn.classList.remove('active');
                manageBtn.classList.add('active');
                currentTab = 'manage';
                loadEvents();
            }
        }

        // Close modal
        function closeModal() {
            document.getElementById('editModal').style.display = 'none';
        }

        // Handle logout
        function handleLogout(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }

        // View participants
        async function viewParticipants(eventId) {
            try {
                const response = await fetch(`${API_BASE}/events/${eventId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const event = await response.json();

                if (response.ok) {
                    displayParticipantsModal(event);
                } else {
                    alert('Error loading event details.');
                }
            } catch (error) {
                console.error('Error fetching participants:', error);
                alert('Error loading participants.');
            }
        }

        // Display participants in modal
        function displayParticipantsModal(event) {
            const modal = document.getElementById('participantsModal');
            const participantsList = document.getElementById('participantsList');

            let contentHTML = `
                <div class="participants-header">
                    <h3>Event Participants</h3>
                    <div class="event-info">
                        <h4>${event.title}</h4>
                        <p><i class="fas fa-calendar-alt"></i> ${new Date(event.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    </div>
                    <div class="participants-count">
                        <span class="count-badge">${event.participants ? event.participants.length : 0} Participants</span>
                        <button class="export-btn" onclick="exportParticipants('${event._id}')">
                            <i class="fas fa-download"></i> Export to Excel
                        </button>
                    </div>
                </div>
            `;

            if (event.participants && event.participants.length > 0) {
                contentHTML += `
                    <div class="participants-table-container">
                        <table class="participants-table">
                            <thead>
                                <tr>
                                    <th><i class="fas fa-user"></i> Name</th>
                                    <th><i class="fas fa-id-card"></i> Roll No</th>
                                    <th><i class="fas fa-graduation-cap"></i> Class</th>
                                    <th><i class="fas fa-envelope"></i> Email</th>
                                    <th><i class="fas fa-building"></i> Department</th>
                                    <th><i class="fas fa-calendar"></i> Year</th>
                                    <th><i class="fas fa-mobile-alt"></i> Phone</th>
                                    <th><i class="fas fa-utensils"></i> Dietary</th>
                                    <th><i class="fas fa-wheelchair"></i> Special Needs</th>
                                    <th><i class="fas fa-check"></i> Terms</th>
                                    <th><i class="fas fa-bell"></i> Updates</th>
                                    <th><i class="fas fa-clock"></i> Registered</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                event.participants.forEach(participant => {
                    const user = participant.user || participant; // Handle both old and new structure
                    const regData = participant.registrationData || {};
                    const registeredAt = participant.registeredAt ? new Date(participant.registeredAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'N/A';

                    contentHTML += `
                        <tr>
                    <td class="participant-name">${regData.studentName || user.username || 'N/A'}</td>
                    <td class="participant-rollno">${regData.rollNo || 'N/A'}</td>
                    <td class="participant-class">${regData.class || 'N/A'}</td>
                    <td class="participant-email">${user.email || 'N/A'}</td>
                    <td class="participant-dept">${regData.department || 'N/A'}</td>
                    <td class="participant-year">${regData.year || 'N/A'}</td>
                    <td class="participant-mobile">${regData.phone || 'N/A'}</td>
                    <td class="participant-dietary">${regData.dietary || 'None'}</td>
                    <td class="participant-special">${regData.specialNeeds || 'None'}</td>
                    <td class="participant-terms">
                        <span class="status-badge ${regData.termsAccepted ? 'status-accepted' : 'status-rejected'}">
                            ${regData.termsAccepted ? '✓' : '✗'}
                        </span>
                    </td>
                    <td class="participant-updates">
                        <span class="status-badge ${regData.receiveUpdates ? 'status-yes' : 'status-no'}">
                            ${regData.receiveUpdates ? '✓' : '✗'}
                        </span>
                    </td>
                    <td class="participant-registered">${registeredAt}</td>
                </tr>
            `;
        });

                contentHTML += `
                            </tbody>
                        </table>
                    </div>
                `;

                // Display custom questions answers if any
                const participantsWithCustomAnswers = event.participants.filter(p => p.customAnswers && p.customAnswers.length > 0);
                if (participantsWithCustomAnswers.length > 0) {
                    contentHTML += `
                        <div class="custom-answers-section" style="margin-top: 2rem;">
                            <h4 style="color: #333; margin-bottom: 1rem;"><i class="fas fa-question-circle"></i> Custom Questions Responses</h4>
                    `;

                    participantsWithCustomAnswers.forEach(participant => {
                        const user = participant.user || participant;
                        const customAnswers = participant.customAnswers || [];

                        contentHTML += `
                            <div class="participant-custom-answers" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                <h5 style="color: #4f46e5; margin-bottom: 0.5rem;">${user.username || 'N/A'}'s Responses:</h5>
                                <ul style="list-style: none; padding: 0;">
                        `;

                        customAnswers.forEach(answer => {
                            let answerDisplay = answer.answer;
                            if (Array.isArray(answer.answer)) {
                                answerDisplay = answer.answer.join(', ');
                            }
                            contentHTML += `
                                <li style="margin-bottom: 0.5rem; padding: 0.5rem; background: white; border-radius: 4px;">
                                    <strong style="color: #333;">${answer.question}:</strong>
                                    <span style="color: #666; margin-left: 0.5rem;">${answerDisplay || 'No answer'}</span>
                                </li>
                            `;
                        });

                        contentHTML += `
                                </ul>
                            </div>
                        `;
                    });

                    contentHTML += `</div>`;
                }
            } else {
                contentHTML += `
                    <div class="no-participants">
                        <i class="fas fa-users"></i>
                        <h4>No Participants Yet</h4>
                        <p>This event doesn't have any registered participants.</p>
                    </div>
                `;
            }

            participantsList.innerHTML = contentHTML;
            modal.style.display = 'block';

            // Setup modal close functionality
            const closeBtn = document.getElementById('participantsModalClose');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                };
            }

            // Close modal when clicking outside
            window.onclick = function(event) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            };
        }

        // Export participants to Excel
        async function exportParticipants(eventId) {
            try {
                const response = await fetch(`${API_BASE}/events/${eventId}/export-participants`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    // Create a blob from the response
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);

                    // Create a temporary link element and trigger download
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'participants.xlsx';
                    document.body.appendChild(a);
                    a.click();

                    // Clean up
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    alert('Participants data exported successfully!');
                } else {
                    const result = await response.json();
                    alert('Error exporting participants: ' + result.message);
                }
            } catch (error) {
                console.error('Error exporting participants:', error);
                alert('An error occurred while exporting participants.');
            }
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                closeModal();
            }
        }
