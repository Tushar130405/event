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

    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    // Show loading state
    const submitBtn = e.target.querySelector('.admin-submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${ADMIN_API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Verify user is organizer (admin, teacher, staff, volunteer)
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
        } else {
            showAdminMessage(data.message || 'Login failed. Please check your credentials.', true);
        }
    } catch (error) {
        console.error('Login error:', error);
        showAdminMessage('Network error. Please try again later.', true);
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
