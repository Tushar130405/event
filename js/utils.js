// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Utility functions
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

function getUserRole() {
    const token = getToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role;
        } catch {
            return null;
        }
    }
    return null;
}

function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.color = isError ? 'red' : 'green';
}

function validateEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
}
