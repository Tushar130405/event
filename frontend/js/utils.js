// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Expose to window for other scripts
window.API_BASE = API_BASE;

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

// Loading overlay helpers
let _loaderStart = 0;
let _loaderTimeout = null;
const _LOADER_MIN_DURATION = 500; // milliseconds (1.0 sec)

function showLoader(message = 'Loading...') {
    let loader = document.getElementById('loader');
    if (!loader) return;
    // cancel pending hide if any (new action)
    if (_loaderTimeout) {
        clearTimeout(_loaderTimeout);
        _loaderTimeout = null;
    }
    const textEl = loader.querySelector('#loaderText');
    if (textEl) textEl.textContent = message;
    loader.style.display = 'flex';
    _loaderStart = Date.now();
}

function hideLoader() {
    let loader = document.getElementById('loader');
    if (!loader) return;
    const elapsed = Date.now() - _loaderStart;
    if (elapsed < _LOADER_MIN_DURATION) {
        _loaderTimeout = setTimeout(() => {
            loader.style.display = 'none';
            _loaderTimeout = null;
        }, _LOADER_MIN_DURATION - elapsed);
    } else {
        loader.style.display = 'none';
    }
}

// globally wrap fetch to automatically show/hide loader and enforce a timeout
(function() {
    if (!window.fetch) return;
    const _fetch = window.fetch.bind(window);
    const DEFAULT_TIMEOUT = 15000; // 15 seconds (was too low previously)

    window.fetch = async function(resource, options = {}) {
        // create an abort controller to implement timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
        options.signal = controller.signal;

        const loader = document.getElementById('loader');
        const alreadyVisible = loader && loader.style.display === 'flex';

        try {
            if (!alreadyVisible) showLoader();
            const response = await _fetch(resource, options);
            clearTimeout(timeoutId);
            return response;
        } catch (err) {
            clearTimeout(timeoutId);
            // translate abort error into a more friendly message
            if (err.name === 'AbortError') {
                console.error('Fetch request timed out:', resource);
                throw new Error('Request timed out');
            }
            throw err;
        } finally {
            if (!alreadyVisible) hideLoader();
        }
    };
})();

