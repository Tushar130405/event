// Smooth scrolling for navigation links
document.querySelectorAll('.header-elements a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.hash !== "") {
            e.preventDefault();
            const hash = this.hash;
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

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
    if (navLinks && menuBtn && !menuBtn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('active');
    }
});

// Update login buttons based on user role
function updateLoginButtons() {
    const token = getToken();
    const loginLi = document.querySelector('.btn-login')?.parentElement;
    const dashboardLink = document.getElementById('dashboardLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token) {
        const role = getUserRole();
        // Hide login button
        if (loginLi) {
            loginLi.style.display = 'none';
        }
        if (role === 'student') {
            if (dashboardLink) {
                dashboardLink.textContent = 'Dashboard';
                dashboardLink.href = 'user-dashboard.html';
                dashboardLink.style.display = 'inline-block';
            }
        } else if (role === 'admin' || role === 'organizer') {
            if (dashboardLink) {
                dashboardLink.textContent = 'Manage Events';
                dashboardLink.href = 'event-management.html';
                dashboardLink.style.display = 'inline-block';
            }
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'inline-block';
            logoutBtn.addEventListener('click', () => {
                // show a brief loading indicator before redirecting
                showLoader('Logging out...');
                removeToken();
                setTimeout(() => {
                    hideLoader();
                    window.location.href = 'index.html';
                }, 300); // give loader a moment to appear
            });
        }
    } else {
        // Show login button and hide dashboard and logout buttons
        if (loginLi) {
            loginLi.style.display = '';
        }
        if (dashboardLink) {
            dashboardLink.style.display = 'none';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
}

// Initialize navigation on DOM load
document.addEventListener('DOMContentLoaded', () => {
    updateLoginButtons();
});
