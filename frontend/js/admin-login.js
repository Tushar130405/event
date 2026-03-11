// Admin Login JavaScript
const ADMIN_API_BASE = 'http://localhost:3000/api';

// Admin login form handler
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
});

// Handle admin login
async function handleAdminLogin(e) {
    e.preventDefault();

    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    
    if (!emailInput || !passwordInput) {
        showAdminMessage('Form fields not found. Please refresh the page.', true);
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate inputs
    if (!email || !password) {
        showAdminMessage('Please enter both email and password.', true);
        return;
    }

    if (!email.includes('@')) {
        showAdminMessage('Please enter a valid email address.', true);
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('.admin-submit-btn');
    if (!submitBtn) {
        showAdminMessage('Submit button not found.', true);
        return;
    }
    
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;

    try {
        const requestBody = { email, password };
        console.log('Sending login request:', { email: email.substring(0, 3) + '***' }); // Log partial email for debugging

        const response = await fetch(`${ADMIN_API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            showAdminMessage(`Server error: ${response.status} ${response.statusText}. Please try again.`, true);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        if (response.ok) {
            if (!data.token) {
                showAdminMessage('Login response missing token. Please contact support.', true);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

            // Verify user is organizer (admin, teacher, staff, volunteer)
            try {
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                const userRole = payload.role;

                const allowedRoles = ['admin', 'teacher', 'staff', 'volunteer'];
                if (!allowedRoles.includes(userRole)) {
                    showAdminMessage('Access denied. This login is for event organizers only.', true);
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    return;
                }

                // Store token and redirect
                localStorage.setItem('token', data.token);
                showAdminMessage('Login successful! Redirecting to admin dashboard...', false);

                setTimeout(() => {
                    window.location.href = 'event-management.html';
                }, 1500);
            } catch (tokenError) {
                console.error('Token parsing error:', tokenError);
                showAdminMessage('Invalid token received. Please try again.', true);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } else {
            // Handle error response
            const errorMessage = data.message || data.error || `Login failed (${response.status}). Please check your credentials.`;
            showAdminMessage(errorMessage, true);
            console.error('Login failed:', { status: response.status, data });
        }
    } catch (error) {
        console.error('Login error:', error);
        // make sure loader is hidden if something went wrong unexpectedly
        hideLoader();

        if (error.message && error.message.toLowerCase().includes('timeout')) {
            showAdminMessage('Request timed out. Please check if the server is running.', true);
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showAdminMessage('Cannot connect to server. Please check if the server is running.', true);
        } else {
            showAdminMessage(`Network error: ${error.message}. Please try again later.`, true);
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Show admin message
function showAdminMessage(message, isError = false) {
    const messageElement = document.getElementById('adminMessage');
    messageElement.textContent = message;
    messageElement.style.display = 'block';
    messageElement.style.backgroundColor = isError ? '#fee' : '#efe';
    messageElement.style.color = isError ? '#c33' : '#363';
    messageElement.style.border = `1px solid ${isError ? '#fcc' : '#cfc'}`;
    messageElement.style.borderRadius = '6px';
    messageElement.style.padding = '12px';
    messageElement.style.margin = '20px 30px 0';
    messageElement.style.fontWeight = '500';

    // Auto-hide success messages after 3 seconds
    if (!isError) {
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
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
            if (navLinks) {
                navLinks.classList.remove('active');
            }
            if (hamburger) {
                hamburger.classList.remove('active');
            }
        });
    });
});
