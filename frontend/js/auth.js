// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginForm.email.value;
        const password = loginForm.password.value;

        try {
            // custom loader so message can be shown until we manually hide
            showLoader('Logging in...');
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            hideLoader();
            if (response.ok) {
                setToken(data.token);
                showMessage('message', 'Login successful! Redirecting...');

                // Decode token to get user role
                const payload = JSON.parse(atob(data.token.split('.')[1]));
                const userRole = payload.role;

                setTimeout(() => {
                    if (userRole === 'student') {
                        window.location.href = 'user-dashboard.html';
                    } else {
                        showMessage('message', 'Please use the admin login page for event organizers.', true);
                    }
                }, 1000);
            } else {
                showMessage('message', data.message, true);
            }
        } catch (error) {
            hideLoader();
            // network errors or aborted requests will throw here
            if (error.message && error.message.toLowerCase().includes('timeout')) {
                showMessage('message', 'Request timed out. Is the server running?', true);
            } else {
                showMessage('message', 'An error occurred. Please try again.', true);
            }
        }
    });
}

// Register form for student
const studentForm = document.getElementById('studentForm');
if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = studentForm.username.value.trim();
        const email = studentForm.email.value.trim();
        const collegeName = studentForm.collegeName.value.trim();
        const department = studentForm.department.value.trim();
        const mobileNo = studentForm.mobileNo.value.trim();
        const password = studentForm.password.value;
        const confirmPassword = studentForm.confirmPassword.value;

        if (!validateEmail(email)) {
            showMessage('studentMessage', 'Please enter a valid email address', true);
            return;
        }

        if (password !== confirmPassword) {
            showMessage('studentMessage', 'Passwords do not match', true);
            return;
        }

        try {
            showLoader('Registering account...');
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: 'student',
                    username,
                    email,
                    collegeName,
                    department,
                    mobileNo,
                    password
                }),
            });

            const data = await response.json();

            hideLoader();
            if (response.ok) {
                showMessage('studentMessage', 'Registration successful! Please login.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage('studentMessage', data.message, true);
            }
        } catch (error) {
            hideLoader();
            if (error.message && error.message.toLowerCase().includes('timeout')) {
                showMessage('studentMessage', 'Request timed out. Is the server running?', true);
            } else {
                showMessage('studentMessage', 'An error occurred. Please try again.', true);
            }
        }
    });
}
