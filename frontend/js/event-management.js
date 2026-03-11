// API_BASE is now exposed in utils.js and available via window.API_BASE


// Event Categories and Sub-Events Mapping
const eventCategories = {
    corporate: [
        'Conferences – Industry talks, keynote sessions, networking',
        'Seminars & Workshops – Skill development, training sessions',
        'Product Launches – Brand promotion, media interaction',
        'Annual General Meetings (AGM) – Shareholder discussions',
        'Corporate Parties – Team bonding, celebrations',
        'Award Ceremonies – Employee recognition programs'
    ],
    wedding: [
        'Engagement Ceremony – Ring exchange, décor, catering',
        'Mehendi Function – Traditional setup, artists, music',
        'Sangeet Night – Dance performances, DJ, lighting',
        'Haldi Ceremony – Ritual décor, photography',
        'Wedding Ceremony – Mandap setup, rituals coordination',
        'Reception – Stage décor, food, guest management'
    ],
    college: [
        'Cultural Fest – Dance, music, drama performances',
        'Technical Fest – Hackathons, coding contests',
        'Sports Events – Tournaments, matches, fitness events',
        'Freshers Party – Welcome event for new students',
        'Farewell Party – Graduation celebrations',
        'Workshops & Guest Lectures – Skill and career guidance'
    ],
    cultural: [
        'Music Concerts – Live bands, singers, sound setup',
        'Dance Shows – Classical, western, group performances',
        'Drama & Theatre – Stage plays, storytelling',
        'Stand-Up Comedy Shows – Comedy artists, audience engagement',
        'Fashion Shows – Ramp walk, choreography, styling'
    ],
    social: [
        'Birthday Parties – Theme décor, games, cake arrangement',
        'Anniversary Celebrations – Customized themes',
        'Baby Shower – Games, decorations, photography',
        'Naming Ceremony – Ritual planning, guest handling',
        'Family Get-Together – Food, entertainment, logistics'
    ],
    sports: [
        'Cricket Tournaments – Match scheduling, live scoring',
        'Football Tournaments – Team coordination, referee',
        'Marathons – Route planning, registration, safety',
        'Indoor Games – Chess, badminton, table tennis',
        'School Sports Day – Track events, prize distribution'
    ],
    virtual: [
        'Webinars – Online learning sessions',
        'Virtual Conferences – Multi-speaker online events',
        'Online Workshops – Live training program',
        'Live Streaming Events – YouTube, Zoom, Teams',
        'E-Sports Tournaments – Online gaming competitions'
    ],
    exhibition: [
        'Trade Shows – Business exhibitions',
        'Product Exhibitions – Product display & demos',
        'Brand Promotions – Roadshows, mall activations',
        'Art Exhibitions – Painting, sculpture displays',
        'Food Festivals – Food stalls, tasting events'
    ]
};

// DOM Elements
let currentUser = null;
let currentTab = 'create';
let scheduleItemCount = 1;
let createdEventId = null; // holds id when event details are saved (step1)

// Tab switching - defined at top level so onclick="showTab(...)" always works
window.showTab = function(tabName) {
    const createTab = document.getElementById('createTab');
    const manageTab = document.getElementById('manageTab');
    const scannerTab = document.getElementById('scannerTab');
    const analyticsTab = document.getElementById('analyticsTab');
    const tabButtons = document.querySelectorAll('.tab-btn');

    if (createTab) createTab.style.display = 'none';
    if (manageTab) manageTab.style.display = 'none';
    if (scannerTab) scannerTab.style.display = 'none';
    if (analyticsTab) analyticsTab.style.display = 'none';

    tabButtons.forEach(btn => btn.classList.remove('active'));

    if (tabName === 'create') {
        if (createTab) createTab.style.display = 'block';
        tabButtons[0]?.classList.add('active');
        currentTab = 'create';
    } else if (tabName === 'manage') {
        if (manageTab) manageTab.style.display = 'block';
        tabButtons[1]?.classList.add('active');
        currentTab = 'manage';
        if (typeof loadEvents === 'function') loadEvents();
    } else if (tabName === 'scanner') {
        if (scannerTab) scannerTab.style.display = 'block';
        tabButtons[2]?.classList.add('active');
        currentTab = 'scanner';
        if (typeof loadScannerEvents === 'function') loadScannerEvents();
    } else if (tabName === 'analytics') {
        if (analyticsTab) analyticsTab.style.display = 'block';
        tabButtons[3]?.classList.add('active');
        currentTab = 'analytics';
        if (typeof loadAnalytics === 'function') loadAnalytics();
    }
};

window.filterEvents = function() {
    if (typeof loadEvents === 'function') loadEvents();
};

window.initializeForm = function() {
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dateInput.value = now.toISOString().slice(0, 16);
    }
};

window.closeModal = function() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    initializeForm();
    // make sure question container is sortable even if hidden
    if (typeof initializeQuestionDrag === 'function') initializeQuestionDrag();
    // Expose loadEvents and loadAnalytics globally so showTab can call them when switching tabs
    window.loadEvents = loadEvents;
    window.loadAnalytics = loadAnalytics;
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
                updateHeroStats();
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

            const userName = document.getElementById('userName');
            const userRole = document.getElementById('userRole');
            const userCollege = document.getElementById('userCollege');

            if (userName) {
                userName.textContent = `Welcome back, ${currentUser.username || 'Organizer'}!`;
            }
            if (userRole) {
                userRole.textContent = `Role: ${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}`;
            }
            if (userCollege) {
                userCollege.textContent = `Organization: ${currentUser.collegeName || 'Not specified'}`;
            }
        }

        // Initialize form
        function initializeForm() {
            // Set default date to today
            const dateInput = document.getElementById('eventDate');
            if (dateInput) {
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                dateInput.value = now.toISOString().slice(0, 16);
            }
        }

        // Update sub-events based on main category (global function)
        window.updateSubEvents = function() {
            const mainCategory = document.getElementById('mainCategory').value;
            const subEventSelect = document.getElementById('subEvent');
            
            if (!subEventSelect) return;
            
            // Clear existing options
            subEventSelect.innerHTML = '<option value="">Select Sub-Event</option>';
            
            if (mainCategory && eventCategories[mainCategory]) {
                eventCategories[mainCategory].forEach((subEvent, index) => {
                    const option = document.createElement('option');
                    option.value = subEvent.split(' – ')[0].toLowerCase().replace(/\s+/g, '-');
                    option.textContent = subEvent;
                    subEventSelect.appendChild(option);
                });
            }
        }

        // Add schedule item (global function)
        window.addScheduleItem = function() {
            const container = document.getElementById('scheduleContainer');
            if (!container) return;

            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';
            scheduleItem.innerHTML = `
                <div class="form-grid">
                    <div class="form-group">
                        <label>Schedule Item</label>
                        <input type="text" name="schedule[${scheduleItemCount}][title]" placeholder="e.g., Opening Ceremony">
                    </div>
                    <div class="form-group">
                        <label>Time</label>
                        <input type="time" name="schedule[${scheduleItemCount}][time]">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" name="schedule[${scheduleItemCount}][description]" placeholder="Brief description">
                    </div>
                    <div class="form-group">
                        <label>&nbsp;</label>
                        <button type="button" class="btn-remove-item" onclick="removeScheduleItem(this)">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(scheduleItem);
            scheduleItemCount++;
        }

        // Remove schedule item (global function)
        window.removeScheduleItem = function(button) {
            const scheduleItem = button.closest('.schedule-item');
            if (scheduleItem) {
                scheduleItem.remove();
            }
        }

        // Reset form (global function)
        window.resetForm = function() {
            if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
                document.getElementById('eventForm').reset();
                document.getElementById('customQuestionsContainer').innerHTML = '';
                document.getElementById('scheduleContainer').innerHTML = `
                    <div class="schedule-item">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Schedule Item</label>
                                <input type="text" name="schedule[0][title]" placeholder="e.g., Opening Ceremony">
                            </div>
                            <div class="form-group">
                                <label>Time</label>
                                <input type="time" name="schedule[0][time]">
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <input type="text" name="schedule[0][description]" placeholder="Brief description">
                            </div>
                        </div>
                    </div>
                `;
                scheduleItemCount = 1;
                initializeForm();
                // reset wizard state
                document.getElementById('step2').style.display = 'none';
                document.getElementById('step1').style.display = 'block';
                const stepsEl = document.getElementById('formSteps');
                if (stepsEl) stepsEl.textContent = 'Step 1 of 2: Event Details';
                createdEventId = null;
            }
        }

        // Setup event listeners
        function setupEventListeners() {
            // Event form controls
            document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
            document.getElementById('nextToRegistration').addEventListener('click', createEventStep1);
            document.getElementById('backToEvent').addEventListener('click', () => {
                document.getElementById('step2').style.display = 'none';
                document.getElementById('step1').style.display = 'block';
                const stepsEl = document.getElementById('formSteps');
                if (stepsEl) stepsEl.textContent = 'Step 1 of 2: Event Details';
            });
            document.getElementById('editEventForm').addEventListener('submit', handleEditSubmit);

            // Add custom question button (works in step2)
            const addQuestionBtn = document.getElementById('addCustomQuestionBtn');
            if (addQuestionBtn) {
                addQuestionBtn.addEventListener('click', addCustomQuestionField);
            }

            // Logout
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }

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
                    if (navLinks) navLinks.classList.remove('active');
                    const menuBtn = document.getElementById('menuBtn');
                    if (menuBtn) menuBtn.classList.remove('active');
                });
            });
        }

        // Helper: gather step1 form data (excluding custom questions)
        function gatherEventDetails() {
            const form = document.getElementById('eventForm');
            const formData = new FormData(form);
            const tags = formData.get('tags') ? formData.get('tags').split(',').map(t=>t.trim()).filter(t=>t) : [];

            // schedule items
            const scheduleItems = [];
            const scheduleInputs = form.querySelectorAll('[name^="schedule["]');
            const scheduleMap = {};
            scheduleInputs.forEach(input => {
                const match = input.name.match(/schedule\[(\d+)\]\[(\w+)\]/);
                if (match) {
                    const idx = match[1];
                    const field = match[2];
                    if (!scheduleMap[idx]) scheduleMap[idx] = {};
                    scheduleMap[idx][field] = input.value;
                }
            });
            Object.values(scheduleMap).forEach(item=>{
                if (item.title && item.time) scheduleItems.push(item);
            });

            return {
                title: formData.get('title'),
                date: formData.get('date'),
                endDate: formData.get('endDate') || null,
                location: formData.get('location'),
                mainCategory: formData.get('mainCategory') || '',
                subEvent: formData.get('subEvent') || '',
                category: formData.get('category') || 'other',
                description: formData.get('description'),
                image: formData.get('image') || 'https://via.placeholder.com/400x200?text=Event+Image',
                maxAttendees: formData.get('maxAttendees') ? parseInt(formData.get('maxAttendees')) : null,
                registrationDeadline: formData.get('registrationDeadline') || null,
                tags: tags,
                prerequisites: formData.get('prerequisites') || '',
                contactEmail: formData.get('contactEmail') || '',
                contactPhone: formData.get('contactPhone') || '',
                website: formData.get('website') || '',
                price: formData.get('price') ? parseFloat(formData.get('price')) : 0,
                earlyBirdPrice: formData.get('earlyBirdPrice') ? parseFloat(formData.get('earlyBirdPrice')) : null,
                schedule: scheduleItems,
                allowParticipation: formData.has('allowParticipation'),
                requireApproval: formData.has('requireApproval'),
                enableEPass: formData.has('enableEPass')
            };
        }

        // step1 button handler: create or update event details then move to step2
        async function createEventStep1(e) {
            e.preventDefault();
            const data = gatherEventDetails();
            try {
                showLoader(!createdEventId ? 'Creating event...' : 'Updating event...');
                let response, result;
                if (!createdEventId) {
                    response = await fetch(`${API_BASE}/events`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(data)
                    });
                    result = await response.json();
                    if (response.ok) {
                        createdEventId = result._id || result.id;
                    }
                } else {
                    response = await fetch(`${API_BASE}/events/${createdEventId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(data)
                    });
                    result = await response.json();
                }

                hideLoader();
                if (response.ok) {
                    showMessage('message','Event details saved. You can now add registration questions.');
                    document.getElementById('step1').style.display = 'none';
                    document.getElementById('step2').style.display = 'block';
                    // update step indicator
                    const stepsEl = document.getElementById('formSteps');
                    if (stepsEl) stepsEl.textContent = 'Step 2 of 2: Registration Questions';
                    initializeQuestionDrag();
                    // refresh list so new event is visible
                    if (typeof loadEvents === 'function') loadEvents();
                } else {
                    const err = result.message || response.statusText;
                    showMessage('message','Error saving event details: '+err, true);
                }
            } catch (error) {
                console.error('Error saving step1 details:', error);
                showMessage('message','Network error: '+error.message, true);
            }
        }

        // final submit handler for registration questions (step2)
        async function handleEventSubmit(e) {
            e.preventDefault();
            if (!createdEventId) {
                showMessage('message','Please complete event details first.', true);
                return;
            }
            const questions = getCustomQuestionsFromForm(document.getElementById('eventForm'));
            try {
                const response = await fetch(`${API_BASE}/events/${createdEventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ customQuestions: questions })
                });
                const result = await response.json();
                if (response.ok) {
                    showMessage('message','Event created and registration form saved successfully!');
                    resetForm();
                    document.getElementById('step2').style.display = 'none';
                    document.getElementById('step1').style.display = 'block';
                    createdEventId = null;
                    loadEvents();
                } else {
                    const err = result.message || response.statusText;
                    showMessage('message','Error saving registration form: '+err, true);
                }
            } catch (error) {
                console.error('Error updating event:', error);
                showMessage('message','Network error: '+error.message, true);
            }
        }

        // Load events - Now uses /my-events endpoint filtered by tenantId
        async function loadEvents() {
            const eventsList = document.getElementById('eventsList');
            if (!eventsList) {
                console.error('eventsList element not found');
                return;
            }

            try {
                showLoader('Loading events...');
                // Use the new /my-events endpoint to get events filtered by tenantId (college)
                const response = await fetch(`${API_BASE}/events/my-events`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    eventsList.innerHTML = `<div class="empty-state"><h4>Error loading events</h4><p>${errorData.message || 'Please try again later.'}</p></div>`;
                    return;
                }

                const events = await response.json();
                hideLoader();
                
                if (!Array.isArray(events)) {
                    eventsList.innerHTML = '<div class="empty-state"><h4>Error loading events</h4><p>Invalid data format.</p></div>';
                    return;
                }

                // apply client-side filters for category/status
                let filtered = events;

                const catFilter = document.getElementById('filterCategory')?.value;
                if (catFilter) {
                    filtered = filtered.filter(e => e.category === catFilter);
                }

                const statusFilter = document.getElementById('filterStatus')?.value;
                if (statusFilter) {
                    const now = new Date();
                    filtered = filtered.filter(e => {
                        const start = new Date(e.date);
                        const end = e.endDate ? new Date(e.endDate) : null;
                        if (statusFilter === 'upcoming') {
                            // anything not explicitly ended yet
                            return !(end && end < now);
                        } else if (statusFilter === 'ongoing') {
                            if (end) {
                                return start <= now && now <= end;
                            } else {
                                return start <= now; // started but not ended
                            }
                        } else if (statusFilter === 'past') {
                            return end && now > end;
                        }
                        return true;
                    });
                }

                displayEvents(filtered);
                // update hero stats in case counts changed (stats are global, not filtered)
                updateHeroStats();
            } catch (error) {
                hideLoader();
                console.error('Error loading events:', error);
                eventsList.innerHTML = '<div class="empty-state"><h4>Error loading events</h4><p>Please check your connection and try again.</p></div>';
            }
        }

// helper to populate questions into builder
function populateCustomQuestions(questions) {
    const container = document.getElementById('customQuestionsContainer');
    if (!container) return;
    container.innerHTML = '';
    questions.forEach((q, idx) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'custom-question';
        questionDiv.setAttribute('draggable','true');
        questionDiv.innerHTML = `
            <span class="drag-handle" title="Drag to reorder"><i class="fas fa-arrows-alt"></i></span>
            <input type="text" name="customQuestions[${idx}][question]" placeholder="Question" value="${q.question.replace(/"/g,'&quot;')}" required />
            <select name="customQuestions[${idx}][type]" onchange="handleQuestionTypeChange(this, ${idx})" required>
                <option value="text" ${q.type==='text'?'selected':''}>Text</option>
                <option value="textarea" ${q.type==='textarea'?'selected':''}>Textarea</option>
                <option value="select" ${q.type==='select'?'selected':''}>Select</option>
                <option value="checkbox" ${q.type==='checkbox'?'selected':''}>Checkbox</option>
                <option value="radio" ${q.type==='radio'?'selected':''}>Radio</option>
            </select>
            <input type="text" name="customQuestions[${idx}][options]" placeholder="Options (comma separated)" style="display:${['select','checkbox','radio'].includes(q.type)?'inline-block':'none'};" value="${(q.options||[]).join(', ')}" ${['select','checkbox','radio'].includes(q.type)?'required':''} />
            <button type="button" onclick="removeCustomQuestionField(this)">Remove</button>
        `;
        container.appendChild(questionDiv);
    });
    if (typeof initializeQuestionDrag==='function') initializeQuestionDrag();
}

// allow admin to configure registration form for an existing event
window.configureRegistration = async function(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const event = await response.json();
        if (!response.ok) {
            toast.error('Error loading event: '+(event.message||response.statusText));
            return;
        }
        // populate step1 fields
        const form = document.getElementById('eventForm');
        if (form) {
            form.title.value = event.title || '';
            form.date.value = new Date(event.date).toISOString().slice(0,16);
            form.endDate.value = event.endDate ? new Date(event.endDate).toISOString().slice(0,16) : '';
            form.location.value = event.location || '';
            form.mainCategory.value = event.mainCategory || '';
            updateSubEvents();
            form.subEvent.value = event.subEvent || '';
            form.category.value = event.category || '';
            form.description.value = event.description || '';
            form.image.value = event.image || '';
            form.tags.value = (event.tags||[]).join(', ');
            form.maxAttendees.value = event.maxAttendees || '';
            form.registrationDeadline.value = event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().slice(0,16) : '';
            form.allowParticipation.checked = event.allowParticipation;
            form.requireApproval.checked = event.requireApproval;
            form.price.value = event.price || '';
            form.earlyBirdPrice.value = event.earlyBirdPrice || '';
            form.contactEmail.value = event.contactEmail || '';
            form.contactPhone.value = event.contactPhone || '';
            form.website.value = event.website || '';
            form.prerequisites.value = event.prerequisites || '';
            // populate schedule if available
            if (Array.isArray(event.schedule)) {
                const container = document.getElementById('scheduleContainer');
                container.innerHTML = '';
                scheduleItemCount = 0;
                event.schedule.forEach((sch, idx) => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'schedule-item';
                    itemDiv.innerHTML = `
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Schedule Item</label>
                                <input type="text" name="schedule[${idx}][title]" placeholder="e.g., Opening Ceremony" value="${sch.title||''}">
                            </div>
                            <div class="form-group">
                                <label>Time</label>
                                <input type="time" name="schedule[${idx}][time]" value="${sch.time||''}">
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <input type="text" name="schedule[${idx}][description]" placeholder="Brief description" value="${sch.description||''}">
                            </div>
                        </div>
                    `;
                    container.appendChild(itemDiv);
                    scheduleItemCount++;
                });
            }
        }
        createdEventId = eventId;
        document.getElementById('step1').style.display='none';
        document.getElementById('step2').style.display='block';
        const stepsEl = document.getElementById('formSteps');
        if (stepsEl) stepsEl.textContent = 'Step 2 of 2: Registration Questions';
        populateCustomQuestions(event.customQuestions || []);
    } catch (err) {
        console.error('Error fetching event for registration config', err);
    }
};

// Display events
function displayEvents(events) {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) {
        console.error('eventsList element not found');
        return;
    }

    if (!events || !Array.isArray(events)) {
        eventsList.innerHTML = '<div class="empty-state"><h4>Error loading events</h4><p>Invalid data received.</p></div>';
        return;
    }

    if (events.length === 0) {
        eventsList.innerHTML = '<div class="empty-state"><h4>No events found</h4><p>You haven\'t created any events yet. Create your first event!</p></div>';
        return;
    }

    // helper to build HTML for a list of events
    function renderCards(list) {
        return list.map(event => {
            const start = new Date(event.date);
            const date = start.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            let endLabel = '';
            if (event.endDate) {
                const end = new Date(event.endDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                endLabel = ` &ndash; ${end}`;
            }

            const participantCount = event.participants ? event.participants.length : 0;
            const tenantInfo = event.tenantName ? `<p>🏛️ ${event.tenantName}</p>` : '';

            // end event button visible when there's no endDate yet
            const endBtn = !event.endDate ? `<button class="end-btn" onclick="endEvent('${event._id}')">End Event</button>` : '';

            return `
                <div class="event-card">
                    <h4>${event.title}</h4>
                    ${tenantInfo}
                    <p class="event-date">📅 ${date}${endLabel}</p>
                    <p class="event-location">📍 ${event.location}</p>
                    <p>🏷️ ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</p>
                    <p>👥 Participants: ${participantCount}</p>
                    <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                    <div class="event-actions">
                        <button class="view-btn" onclick="viewParticipants('${event._id}')">View Participants</button>
                        ${event.enableEPass ? `<button class="view-btn view-passes-btn" onclick="viewPasses('${event._id}')">View Participant Passes</button>` : ''}
                        <button class="edit-btn" onclick="editEvent('${event._id}')">Edit</button>
                        <button class="edit-form-btn" onclick="configureRegistration('${event._id}')">Configure Form</button>
                        ${endBtn}
                        <button class="delete-btn" onclick="deleteEvent('${event._id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // if the user hasn't picked a status filter, group past and current/upcoming events
    const statusFilterVal = document.getElementById('filterStatus')?.value;
    if (!statusFilterVal) {
        const now = new Date();
        const past = [];
        const currentOrUpcoming = [];

        events.forEach(e => {
            const start = new Date(e.date);
            const end = e.endDate ? new Date(e.endDate) : null;
            if (end) {
                if (now > end) {
                    past.push(e);
                } else {
                    currentOrUpcoming.push(e);
                }
            } else {
                // no endDate means treat as ongoing/upcoming until manually ended
                currentOrUpcoming.push(e);
            }
        });

        let html = '';
        if (currentOrUpcoming.length) {
            html += '<h4>Current & Upcoming Events</h4>';
            html += `<div class="events-grid">${renderCards(currentOrUpcoming)}</div>`;
        }
        if (past.length) {
            html += '<h4>Ended Events</h4>';
            html += `<div class="events-grid">${renderCards(past)}</div>`;
        }

        eventsList.innerHTML = html || '<div class="empty-state"><h4>No events found</h4><p>You haven\'t created any events yet. Create your first event!</p></div>';
        return;
    }

    // if a status filter is applied, just render that list
    eventsList.innerHTML = `<div class="events-grid">${renderCards(events)}</div>`;
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
                const editEventTags = document.getElementById('editEventTags');
                if (editEventTags) editEventTags.value = event.tags ? event.tags.join(', ') : '';
                document.getElementById('editPrerequisites').value = event.prerequisites || '';
                const editContactEmail = document.getElementById('editContactEmail');
                if (editContactEmail) editContactEmail.value = event.contactEmail || '';
                document.getElementById('editAllowParticipation').checked = event.allowParticipation || false;
                const enableCheckbox = document.getElementById('editEnableEPass');
                if (enableCheckbox) {
                    enableCheckbox.checked = event.enableEPass || false;
                }

                // Add scrolling class to modal content
                const modalContent = document.querySelector('#editModal .modal-content');
                if (modalContent) {
                    modalContent.classList.add('event-registration-form');
                }

                document.getElementById('editModal').style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching event:', error);
                toast.error('Error loading event details.');
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
                allowParticipation: formData.has('allowParticipation'),
                enableEPass: formData.has('enableEPass')
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
                    toast.success('Event updated successfully!');
                    closeModal();
                    loadEvents();
                } else {
                    toast.error('Error updating event: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('An error occurred while updating the event.');
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
                    toast.success('Event deleted successfully!');
                    loadEvents();
                } else {
                    const result = await response.json();
                    toast.error('Error deleting event: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('An error occurred while deleting the event.');
            }
        }

        // Update hero stats - Uses /my-events endpoint
        async function updateHeroStats() {
            try {
                // Use /my-events to get filtered events by tenant
                const response = await fetch(`${API_BASE}/events/my-events`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (!response.ok) {
                    console.error('Failed to fetch events for stats');
                    return;
                }
                
                const events = await response.json();
                
                if (!Array.isArray(events)) {
                    console.error('Invalid events data');
                    return;
                }
                
                const userEvents = events;
                
                const now = new Date();
                const upcoming = userEvents.filter(e => {
                    // treat everything as upcoming unless an explicit endDate in past
                    return !(e.endDate && new Date(e.endDate) < now);
                });
                const ended = userEvents.filter(e => {
                    return e.endDate && new Date(e.endDate) < now;
                });
                const totalParticipants = userEvents.reduce((sum, e) =>
                    sum + (e.participants && Array.isArray(e.participants) ? e.participants.length : 0), 0
                );

                const totalEventsEl = document.getElementById('totalEventsCount');
                const upcomingEventsEl = document.getElementById('upcomingEventsCount');
                const endedEventsEl = document.getElementById('endedEventsCount');
                const totalParticipantsEl = document.getElementById('totalParticipantsCount');

                if (totalEventsEl) totalEventsEl.textContent = userEvents.length || 0;
                if (upcomingEventsEl) upcomingEventsEl.textContent = upcoming.length || 0;
                if (endedEventsEl) endedEventsEl.textContent = ended.length || 0;
                if (totalParticipantsEl) totalParticipantsEl.textContent = totalParticipants || 0;
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        // Load analytics - Uses /my-events endpoint
        async function loadAnalytics() {
            try {
                // Use /my-events to get filtered events by tenant
                const response = await fetch(`${API_BASE}/events/my-events`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (!response.ok) {
                    console.error('Failed to fetch events for analytics');
                    return;
                }
                
                const events = await response.json();
                
                if (!Array.isArray(events)) {
                    console.error('Invalid events data');
                    return;
                }
                
                const userEvents = events;
                
                const now = new Date();
                const upcoming = userEvents.filter(e => {
                    return !(e.endDate && new Date(e.endDate) < now);
                });
                const ended = userEvents.filter(e => {
                    return e.endDate && new Date(e.endDate) < now;
                });
                const totalParticipants = userEvents.reduce((sum, e) => 
                    sum + (e.participants && Array.isArray(e.participants) ? e.participants.length : 0), 0
                );
                const average = userEvents.length > 0 
                    ? Math.round(totalParticipants / userEvents.length) 
                    : 0;

                const totalEventsEl = document.getElementById('analyticsTotalEvents');
                const totalParticipantsEl = document.getElementById('analyticsTotalParticipants');
                const upcomingEl = document.getElementById('analyticsUpcoming');
                const endedEl = document.getElementById('analyticsEnded');
                const averageEl = document.getElementById('analyticsAverage');

                if (totalEventsEl) totalEventsEl.textContent = userEvents.length || 0;
                if (totalParticipantsEl) totalParticipantsEl.textContent = totalParticipants || 0;
                if (upcomingEl) upcomingEl.textContent = upcoming.length || 0;
                if (endedEl) endedEl.textContent = ended.length || 0;
                if (averageEl) averageEl.textContent = average || 0;
            } catch (error) {
                console.error('Error loading analytics:', error);
            }
        }

        // allow organizer to manually end the event
        async function endEvent(eventId) {
            if (!confirm('Mark this event as ended now?')) {
                return;
            }
            try {
                const response = await fetch(`${API_BASE}/events/${eventId}/end`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const result = await response.json();
                if (response.ok) {
                    toast.success('Event has been marked as ended.');
                    loadEvents();
                } else {
                    toast.error('Error ending event: ' + (result.message || response.statusText));
                }
            } catch (err) {
                console.error('Error ending event:', err);
                toast.error('Network error while ending event.');
            }
        }

        // Close modal
        function closeModal() {
            document.getElementById('editModal').style.display = 'none';
        }

        // Handle logout
        function handleLogout(e) {
            if (e) e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        }

        // Show message helper
        function showMessage(elementId, message, isError = false) {
            const messageEl = document.getElementById(elementId);
            if (messageEl) {
                messageEl.textContent = message;
                messageEl.style.display = 'block';
                messageEl.style.backgroundColor = isError ? '#fee' : '#efe';
                messageEl.style.color = isError ? '#c33' : '#363';
                messageEl.style.border = `1px solid ${isError ? '#fcc' : '#cfc'}`;
                messageEl.style.borderRadius = '6px';
                messageEl.style.padding = '12px';
                messageEl.style.margin = '20px 0';
                
                if (!isError) {
                    setTimeout(() => {
                        messageEl.style.display = 'none';
                    }, 5000);
                }
            }
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
                    toast.error('Error loading event details.');
                }
            } catch (error) {
                console.error('Error fetching participants:', error);
                toast.error('Error loading participants.');
            }
        }

        // View participant e-passes for event
        async function viewPasses(eventId) {
            try {
                const response = await fetch(`${API_BASE}/epasses/event/${eventId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    toast.error('Error loading passes: ' + (err.message || response.statusText));
                    return;
                }

                const data = await response.json();
                displayPassesModal(data);
            } catch (error) {
                console.error('Error fetching passes:', error);
                toast.error('Error loading participant passes.');
            }
        }

        // Display e-passes modal
        function displayPassesModal(data) {
            const modal = document.getElementById('passesModal');
            const passesList = document.getElementById('passesList');

            let contentHTML = `
                <div class="participants-header">
                    <h3>Participant E-Passes</h3>
                    <div class="participants-count">
                        <span class="count-badge">${data.stats ? data.stats.total : 0} Passes</span>
                    </div>
                </div>
            `;

            if (data.epasses && data.epasses.length > 0) {
                contentHTML += `
                    <div class="participants-table-container">
                        <table class="participants-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Sent</th>
                                    <th>Verified</th>
                                    <th>View</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                data.epasses.forEach(e => {
                    const sent = e.sentAt ? new Date(e.sentAt).toLocaleString() : 'N/A';
                    const verified = e.verifiedAt ? new Date(e.verifiedAt).toLocaleString() : 'N/A';
                    contentHTML += `
                        <tr>
                            <td>${e.participantName || 'N/A'}</td>
                            <td>${e.userEmail || 'N/A'}</td>
                            <td>${e.status || 'N/A'}</td>
                            <td>${sent}</td>
                            <td>${verified}</td>
                            <td><button class="btn-small btn-primary" onclick="viewEPassFromEvent('${e.id}')"><i class="fas fa-eye"></i> View</button></td>
                        </tr>
                    `;
                });

                contentHTML += `
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                contentHTML += `
                    <div class="no-participants">
                        <i class="fas fa-ticket-alt"></i>
                        <h4>No Passes Generated</h4>
                        <p>No e-passes are available for this event yet.</p>
                    </div>
                `;
            }

            passesList.innerHTML = contentHTML;
            modal.style.display = 'block';

            const closeBtn = document.getElementById('passesModalClose');
            if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
            // clicking outside handled by global listener
        }

        // View individual e-pass
        async function viewEPassFromEvent(epassId) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/epasses/${epassId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    toast.error('Error loading e-pass');
                    return;
                }

                const epass = await response.json();
                showEPassViewModal(epass);
            } catch (error) {
                console.error('Error loading e-pass:', error);
                toast.error('Error loading e-pass');
            }
        }

        // Show e-pass view modal
        function showEPassViewModal(epass) {
            let modal = document.getElementById('epassViewModal');
            
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'epassViewModal';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content epass-modal-content">
                        <span class="close" onclick="closeEPassModal()">&times;</span>
                        <div id="epassModalContent"></div>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            const statusBadge = getStatusBadge(epass.status);
            const formattedDate = new Date(epass.eventDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const content = `
                <div class="epass-view">
                    <h3>${epass.eventTitle}</h3>
                    <div class="epass-status-info">${statusBadge}</div>

                    <div class="epass-details">
                        <div class="detail-row">
                            <span class="label"><i class="fas fa-user"></i> Name:</span>
                            <span class="value">${epass.participantName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label"><i class="fas fa-calendar-alt"></i> Date:</span>
                            <span class="value">${formattedDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label"><i class="fas fa-map-marker-alt"></i> Location:</span>
                            <span class="value">${epass.eventLocation}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label"><i class="fas fa-tag"></i> Category:</span>
                            <span class="value">${epass.eventCategory}</span>
                        </div>
                    </div>

                    <div class="epass-qr-display">
                        <img src="${epass.qrCode}" alt="QR Code" class="qr-image">
                        <p class="qr-instruction">Show this QR code at the event entrance</p>
                    </div>

                    <div class="epass-action-buttons">
                        <button class="btn-primary" onclick="printEPass('${epass.id}')"><i class="fas fa-print"></i> Print</button>
                        <button class="btn-secondary" onclick="downloadEPass('${epass.id}')"><i class="fas fa-download"></i> Download</button>
                    </div>
                </div>
            `;

            document.getElementById('epassModalContent').innerHTML = content;
            modal.style.display = 'block';
        }

        // Close e-pass modal
        function closeEPassModal() {
            const modal = document.getElementById('epassViewModal');
            if (modal) modal.style.display = 'none';
        }

        // Get status badge HTML
        function getStatusBadge(status) {
            const statusColors = {
                'generated': '#FFA500',
                'sent': '#4285F4',
                'verified': '#34A853',
                'used': '#34A853',
                'cancelled': '#EA4335'
            };
            return `<span class="status-badge" style="background-color: ${statusColors[status] || '#999'}">${status.toUpperCase()}</span>`;
        }

        // Print e-pass
        function printEPass(epassId) {
            const modal = document.getElementById('epassViewModal');
            const printWindow = window.open('', '', 'width=800,height=600');
            printWindow.document.write(modal.innerHTML);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }

        // Download e-pass as PDF (placeholder)
        function downloadEPass(epassId) {
            toast.info('Download feature will be available soon');
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
                        ${event.tenantName ? `<p><i class="fas fa-university"></i> ${event.tenantName}</p>` : ''}
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
                                    <th><i class="fas fa-users"></i> Team</th>
                                    <th><i class="fas fa-tshirt"></i> Jersey No</th>
                                    <th><i class="fas fa-briefcase"></i> Company</th>
                                    <th><i class="fas fa-id-badge"></i> Job Title</th>
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
                    <td class="participant-team">${regData.teamName || 'N/A'}</td>
                    <td class="participant-jersey">${regData.jerseyNumber || 'N/A'}</td>
                    <td class="participant-company">${regData.company || 'N/A'}</td>
                    <td class="participant-job">${regData.jobTitle || 'N/A'}</td>
                    <td class="participant-email">${regData.email || user.email || 'N/A'}</td>
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
            // clicking outside handled by global listener
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

                    toast.success('Participants data exported successfully!');
                } else {
                    const result = await response.json();
                    toast.error('Error exporting participants: ' + result.message);
                }
            } catch (error) {
                console.error('Error exporting participants:', error);
                toast.error('An error occurred while exporting participants.');
            }
        }

        // Close any open modal when clicking outside
        window.onclick = function(event) {
            const editModal = document.getElementById('editModal');
            const participantsModal = document.getElementById('participantsModal');
            const passesModal = document.getElementById('passesModal');
            if (event.target === editModal) {
                closeModal();
            }
            if (event.target === participantsModal) {
                participantsModal.style.display = 'none';
            }
            if (event.target === passesModal) {
                passesModal.style.display = 'none';
            }
        }
