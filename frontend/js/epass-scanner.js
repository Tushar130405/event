/**
 * E-Pass Scanner Module
 * Handles QR code scanning and E-pass verification
 */

let scannerInstance = null;
let currentScannerEvent = null;
let scannedEPasses = [];
let isScannerRunning = false;

/**
 * Load events for the scanner dropdown
 */
async function loadScannerEvents() {
    try {
        const response = await fetch(`${window.API_BASE}/events/my-events`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (!response.ok) {
            console.error('Failed to load events');
            showToast('Failed to load events', 'error');
            return;
        }

        const data = await response.json();
        const events = Array.isArray(data) ? data : (data.events || []);
        const eventSelect = document.getElementById('scannerEventSelect');

        // Clear previous options
        eventSelect.innerHTML = '<option value="">-- Select an event --</option>';

        // Add only upcoming and ongoing events to scanner
        const availableEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            const now = new Date();
            // Show events that are within 24 hours before or after the event date and have e-passes enabled
            return event.enableEPass && eventDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
        });

        availableEvents.forEach(event => {
            const option = document.createElement('option');
            option.value = event._id;
            option.textContent = `${event.title} (${new Date(event.date).toLocaleDateString()})`;
            eventSelect.appendChild(option);
        });

        scannedEPasses = [];
        updateScannedCount();
        clearScannerResults();
    } catch (error) {
        console.error('Error loading scanner events:', error);
        showToast('Error loading events', 'error');
    }
}

/**
 * Handle event selection change
 */
function onEventScannerChange() {
    const eventSelect = document.getElementById('scannerEventSelect');
    currentScannerEvent = eventSelect.value;

    const scannerInterface = document.getElementById('scannerInterface');
    const noEventMessage = document.getElementById('noEventMessage');
    const scannerResultsList = document.getElementById('scannerResultsList');

    if (currentScannerEvent) {
        scannerInterface.style.display = 'block';
        noEventMessage.style.display = 'none';
        scannedEPasses = [];
        clearScannerResults();
        updateScannedCount();
    } else {
        scannerInterface.style.display = 'none';
        noEventMessage.style.display = 'block';
        stopScanner();
    }
}

/**
 * Start the QR code scanner
 */
async function startScanner() {
    if (!currentScannerEvent) {
        showToast('Please select an event first', 'warning');
        return;
    }

    if (isScannerRunning) {
        showToast('Scanner is already running', 'info');
        return;
    }

    try {
        const startBtn = document.getElementById('startScannerBtn');
        const stopBtn = document.getElementById('stopScannerBtn');

        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';

        scannerInstance = new Html5Qrcode('reader');

        // Request camera access
        await scannerInstance.start(
            { facingMode: 'environment' }, // Use rear camera
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
            },
            onScanSuccess,
            onScanError
        );

        isScannerRunning = true;
        showToast('Scanner started successfully', 'success');
    } catch (error) {
        console.error('Error starting scanner:', error);
        showToast(`Failed to start scanner: ${error.message}`, 'error');
        document.getElementById('startScannerBtn').style.display = 'inline-block';
        document.getElementById('stopScannerBtn').style.display = 'none';
    }
}

/**
 * Stop the QR code scanner
 */
async function stopScanner() {
    if (scannerInstance && isScannerRunning) {
        try {
            await scannerInstance.stop();
            scannerInstance.clear();
            isScannerRunning = false;

            document.getElementById('startScannerBtn').style.display = 'inline-block';
            document.getElementById('stopScannerBtn').style.display = 'none';

            showToast('Scanner stopped', 'info');
        } catch (error) {
            console.error('Error stopping scanner:', error);
        }
    }
}

/**
 * Callback when QR code is scanned successfully
 */
function onScanSuccess(decodedText, decodedResult) {
    // Extract token from QR code data
    const token = extractTokenFromQR(decodedText);

    if (token) {
        // Stop scanning to avoid duplicate scans
        stopScanner();
        verifyEPass(token);
    }
}

/**
 * Callback when QR code scan fails
 */
function onScanError(error) {
    // Silently ignore scan errors (not finding a QR code)
    // Only log critical errors
    if (error && !error.toString().includes('NoQRCodeFound')) {
        console.debug('QR Code scan error:', error);
    }
}

/**
 * Extract token from QR code data
 * QR codes typically contain the token or a URL with the token
 */
function extractTokenFromQR(qrData) {
    // If it's a full URL
    if (qrData.includes('/epass/')) {
        const parts = qrData.split('/epass/');
        return parts[parts.length - 1].split('?')[0];
    }

    // If it's just the token
    if (qrData.length > 20 && !qrData.includes(' ')) {
        return qrData;
    }

    // Try to extract from JSON or other formats
    try {
        const data = JSON.parse(qrData);
        return data.token || qrData;
    } catch {
        return qrData;
    }
}

/**
 * Toggle manual input section
 */
function toggleManualInput() {
    const manualInputSection = document.getElementById('manualInputSection');
    const manualInput = document.getElementById('manualEPassToken');

    if (manualInputSection.style.display === 'none' || manualInputSection.style.display === '') {
        manualInputSection.style.display = 'block';
        manualInput.focus();
    } else {
        manualInputSection.style.display = 'none';
        manualInput.value = '';
    }
}

/**
 * Verify manually entered E-pass token
 */
function verifyManualInput() {
    const manualInput = document.getElementById('manualEPassToken');
    const token = manualInput.value.trim();

    if (!token) {
        showToast('Please enter an E-pass token', 'warning');
        return;
    }

    manualInput.value = '';
    verifyEPass(token);
}

/**
 * Verify E-pass by fetching it and marking it as used
 */
async function verifyEPass(token) {
    if (!currentScannerEvent) {
        showToast('Please select an event first', 'warning');
        return;
    }

    try {
        // Show loading state
        showToast('Verifying E-pass...', 'info');

        // First, find the E-pass by token in the current event
        const response = await fetch(
            `${window.API_BASE}/api/epasses?eventId=${currentScannerEvent}&token=${token}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            }
        );

        if (!response.ok) {
            showToast('E-pass not found for this event', 'error');
            return;
        }

        const data = await response.json();
        const epass = data.epasses?.[0];

        if (!epass) {
            showToast('E-pass not found', 'error');
            return;
        }

        // Check if already used
        if (epass.status === 'used') {
            const scannedItem = scannedEPasses.find(item => item._id === epass._id);
            if (scannedItem) {
                showToast('This E-pass has already been scanned', 'warning');
                displayEPassResult(scannedItem, 'already-used');
                return;
            }
        }

        // Mark as used
        const verifyResponse = await fetch(`${window.API_BASE}/api/epasses/${epass._id}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ token: epass.token }),
        });

        if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json();
            if (errorData.error && errorData.error.includes('already been used')) {
                showToast('This E-pass has already been scanned', 'warning');
                displayEPassResult(epass, 'already-used');
            } else {
                showToast(errorData.error || 'Failed to verify E-pass', 'error');
            }
            return;
        }

        const verifyData = await verifyResponse.json();

        // Add to scanned list if not already there
        if (!scannedEPasses.find(item => item._id === epass._id)) {
            scannedEPasses.push({
                ...epass,
                verifiedAt: verifyData.epass.verifiedAt,
            });
            updateScannedCount();
        }

        // Display result
        displayEPassResult(epass, 'success');
        showToast('E-pass verified successfully!', 'success');

        // Restart scanner after a short delay
        setTimeout(() => {
            startScanner();
        }, 2000);
    } catch (error) {
        console.error('Error verifying E-pass:', error);
        showToast(`Error verifying E-pass: ${error.message}`, 'error');
    }
}

/**
 * Display scanned E-pass result
 */
function displayEPassResult(epass, status) {
    const resultsList = document.getElementById('scannerResultsList');

    // Remove empty state if it exists
    const emptyState = resultsList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    const timestamp = new Date().toLocaleTimeString();
    const statusClass = status === 'success' ? 'result-success' : 'result-already-used';
    const statusIcon = status === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const statusText = status === 'success' ? 'Verified' : 'Already Scanned';

    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${statusClass}`;
    resultItem.innerHTML = `
        <div class="result-status">
            <i class="fas ${statusIcon}"></i>
            <span class="status-text">${statusText}</span>
        </div>
        <div class="result-info">
            <div class="result-name">${epass.participantId?.registrationData?.studentName || 'Unknown'}</div>
            <div class="result-token">${epass.token.substring(0, 12)}...</div>
            <div class="result-time">${timestamp}</div>
        </div>
    `;

    resultsList.insertBefore(resultItem, resultsList.firstChild);

    // Keep only last 20 results
    const items = resultsList.querySelectorAll('.result-item');
    if (items.length > 20) {
        items[items.length - 1].remove();
    }
}

/**
 * Clear scanner results
 */
function clearScannerResults() {
    const resultsList = document.getElementById('scannerResultsList');
    resultsList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>Scanned E-passes will appear here</p>
        </div>
    `;
}

/**
 * Update scanned count display
 */
function updateScannedCount() {
    const countElement = document.getElementById('scannedCount');
    if (countElement) {
        const count = scannedEPasses.length;
        countElement.textContent = `${count} scanned`;
    }
}

/**
 * Initialize scanner on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    // Clean up scanner when page unloads
    window.addEventListener('beforeunload', () => {
        if (isScannerRunning) {
            stopScanner();
        }
    });

    // Stop scanner when switching away from scanner tab
    const observeTabSwitch = setInterval(() => {
        if (currentTab !== 'scanner' && isScannerRunning) {
            stopScanner();
        }
    }, 1000);
});
