/**
 * E-Pass Dashboard Component
 * Displays user's e-passes and allows viewing/downloading
 */

// Fetch and display user's e-passes (only for registered events)
window.loadUserEPasses = async function() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      displayNoEPasses();
      return;
    }

    console.log('Loading user e-passes using /user/my-tickets endpoint');

    // Use the dedicated endpoint for user's tickets
    const response = await fetch(`${API_BASE}/epasses/user/my-tickets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch user e-passes:', response.status, response.statusText);
      displayEPassLoadError();
      return;
    }

    const data = await response.json();
    console.log('User e-passes data:', data);

    if (!data.tickets || data.tickets.length === 0) {
      displayNoEPasses();
      return;
    }

    // Transform tickets to match the expected format
    const epasses = data.tickets.map(ticket => ({
      id: ticket.id,
      eventTitle: ticket.eventTitle,
      eventDate: ticket.eventDate,
      eventLocation: ticket.eventLocation,
      eventCategory: ticket.eventCategory,
      participantName: ticket.participantName,
      status: ticket.status,
      qrCode: ticket.qrCode
    }));

    console.log('Total user e-passes:', epasses.length);
    displayEPasses(epasses);

    // Update tickets count in dashboard summary if present
    try {
      const ticketsEl = document.getElementById('ticketsCount');
      if (ticketsEl) ticketsEl.textContent = epasses.length;
    } catch (e) {
      console.error('Error updating tickets count', e);
    }
  } catch (error) {
    console.error('Error loading e-passes:', error);
    displayEPassLoadError();
  }
};

// Display e-passes in dashboard
function displayEPasses(epasses) {
  const container = document.getElementById('myTicketsContainer');
  if (!container) return;

  if (!epasses || epasses.length === 0) {
    displayNoEPasses();
    return;
  }

  let html = `
    <div class="epass-tiles-container">
      <h3><i class="fas fa-ticket-alt"></i> My Event Tickets (${epasses.length})</h3>
      <div class="epass-grid">
  `;

  epasses.forEach(epass => {
    const statusIndicator = getStatusIndicator(epass.status);
    const eventDate = new Date(epass.eventDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    html += `
      <div class="epass-tile ${epass.status === 'used' ? 'used' : ''}">
        <div class="epass-tile-header">
          <h4>${epass.eventTitle || 'Event'}</h4>
          <span class="epass-status-badge ${epass.status}">${statusIndicator}</span>
        </div>
        <div class="epass-tile-date">
          <i class="fas fa-calendar"></i> ${eventDate}
        </div>
        <div class="epass-tile-location">
          <i class="fas fa-map-marker-alt"></i> ${epass.eventLocation || 'Location TBA'}
        </div>
        <div class="epass-tile-actions">
          <button class="btn-small btn-primary" onclick="viewEPass('${epass.id}', '${epass.eventTitle}')">
            <i class="fas fa-qrcode"></i> View Ticket
          </button>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Add CSS if not already present
  if (!document.getElementById('epass-styles')) {
    addEPassStyles();
  }
}

// View e-pass modal
async function viewEPass(epassId, eventTitle) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/epasses/${epassId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      toast.error('Error loading e-pass');
      return;
    }

    const epass = await response.json();
    showEPassModal(epass);
  } catch (error) {
    console.error('Error loading e-pass:', error);
    toast.error('Error loading e-pass');
  }
}

// Show e-pass modal
function showEPassModal(epass) {
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
          <span class="label"><i class="fas fa-hashtag"></i> Token:</span>
          <span class="value">${epass.token}</span>
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

      <div class="epass-actions">
        <button class="btn-primary" onclick="downloadEPassPDF('${epass.id}')">
          <i class="fas fa-download"></i> Download PDF
        </button>
        <button class="btn-secondary" onclick="printEPass()">
          <i class="fas fa-print"></i> Print
        </button>
      </div>
    </div>
  `;

  document.getElementById('epassModalContent').innerHTML = content;
  modal.style.display = 'block';
}

// Close e-pass modal
function closeEPassModal() {
  const modal = document.getElementById('epassViewModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Download e-pass as PDF
async function downloadEPassPDF(epassId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/epasses/${epassId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      toast.error('Error loading e-pass');
      return;
    }

    const epass = await response.json();

    // Create a canvas from the QR code and generate PDF
    // For now, we'll create a simple HTML-to-PDF approach
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.innerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Event E-Pass</title>
      </head>
      <body>
        <h1>${epass.eventTitle}</h1>
        <p>Name: ${epass.participantName}</p>
        <p>Token: ${epass.token}</p>
        <p>Email: ${epass.userEmail}</p>
        <img src="${epass.qrCode}" alt="QR Code" style="max-width: 300px; margin: 20px 0;">
        <p>Please scan the QR code above at the event entrance.</p>
      </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const newWindow = window.open();
    newWindow.document.write(element.innerHTML);
    newWindow.document.close();
    newWindow.print();
  } catch (error) {
    console.error('Error downloading e-pass:', error);
    toast.error('Error downloading e-pass');
  }
}

// Print e-pass
function printEPass() {
  window.print();
}

// Helper to get status indicator text and color
function getStatusIndicator(status) {
  const statusMap = {
    'generated': '📋 Generated',
    'sent': '📧 Sent',
    'verified': '✓ Verified',
    'used': '✓ Used',
    'cancelled': '✗ Cancelled'
  };
  return statusMap[status] || status;
}

// Helper to get status badge HTML
function getStatusBadge(status) {
  const badgeMap = {
    'generated': '<span class="status-badge generated"><i class="fas fa-hourglass-half"></i> Generated</span>',
    'sent': '<span class="status-badge sent"><i class="fas fa-check"></i> Sent</span>',
    'verified': '<span class="status-badge verified"><i class="fas fa-check-double"></i> Verified</span>',
    'used': '<span class="status-badge used"><i class="fas fa-check-circle"></i> Used</span>',
    'cancelled': '<span class="status-badge cancelled"><i class="fas fa-times-circle"></i> Cancelled</span>'
  };
  return badgeMap[status] || status;
}

// Display when no e-passes available
function displayNoEPasses() {
  const container = document.getElementById('myTicketsContainer');
  if (container) {
    container.innerHTML = `
      <div class="no-epass-message">
        <i class="fas fa-ticket-alt"></i>
        <p>You haven't registered for any events yet.</p>
        <p>Visit the <a href="index.html">events page</a> to register for upcoming events and get your e-pass!</p>
      </div>
    `;
  }
}

// Display error loading e-passes
function displayEPassLoadError() {
  const container = document.getElementById('myTicketsContainer');
  if (container) {
    container.innerHTML = `
      <div class="epass-error-message">
        <p>Error loading your e-passes. Please try again later.</p>
      </div>
    `;
  }
}

// Add CSS styles for e-pass components
function addEPassStyles() {
  const style = document.createElement('style');
  style.id = 'epass-styles';
  style.textContent = `
    .epass-tiles-container {
      margin: 30px 0;
    }

    .epass-tiles-container h3 {
      color: #333;
      margin-bottom: 20px;
      font-size: 20px;
      font-weight: 600;
    }

    .epass-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .epass-tile {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 20px;
      transition: all 0.3s ease;
      border-left: 5px solid #667eea;
    }

    .epass-tile:hover {
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      transform: translateY(-5px);
    }

    .epass-tile.used {
      opacity: 0.7;
      background: #f5f5f5;
    }

    .epass-tile-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
    }

    .epass-tile-header h4 {
      color: #333;
      margin: 0;
      flex: 1;
      font-size: 16px;
      font-weight: 600;
    }

    .epass-status-badge {
      font-size: 10px;
      padding: 6px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      white-space: nowrap;
      margin-left: 10px;
    }

    .epass-status-badge.generated {
      background: #fff3cd;
      color: #856404;
    }

    .epass-status-badge.sent {
      background: #d1ecf1;
      color: #0c5460;
    }

    .epass-status-badge.verified {
      background: #d4edda;
      color: #155724;
    }

    .epass-status-badge.used {
      background: #d4edda;
      color: #155724;
    }

    .epass-status-badge.cancelled {
      background: #f8d7da;
      color: #721c24;
    }

    .epass-tile-date {
      color: #666;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .epass-tile-location {
      color: #666;
      font-size: 14px;
      margin-bottom: 12px;
    }

    .epass-tile-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .btn-small {
      padding: 8px 12px;
      font-size: 13px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-small.btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-small.btn-primary:hover {
      background: #5568d3;
    }

    .epass-modal-content {
      max-width: 500px;
    }

    .epass-view {
      padding: 20px;
    }

    .epass-view h3 {
      color: #333;
      margin-bottom: 15px;
    }

    .epass-status-info {
      margin-bottom: 20px;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.generated {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.sent {
      background: #d1ecf1;
      color: #0c5460;
    }

    .status-badge.verified {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.used {
      background: #d4edda;
      color: #155724;
    }

    .epass-details {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row .label {
      font-weight: 600;
      color: #666;
    }

    .detail-row .value {
      text-align: right;
      color: #333;
    }

    .epass-qr-display {
      text-align: center;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 20px 0;
    }

    .qr-image {
      max-width: 250px;
      height: auto;
      margin-bottom: 10px;
    }

    .qr-instruction {
      font-size: 12px;
      color: #666;
      margin: 0;
    }

    .epass-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .epass-actions button {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .epass-actions .btn-primary {
      background: #667eea;
      color: white;
    }

    .epass-actions .btn-primary:hover {
      background: #5568d3;
    }

    .epass-actions .btn-secondary {
      background: #f0f0f0;
      color: #333;
      border: 1px solid #ddd;
    }

    .epass-actions .btn-secondary:hover {
      background: #e8e8e8;
    }

    .no-epass-message {
      text-align: center;
      padding: 40px 20px;
      background: #f9f9f9;
      border-radius: 8px;
      color: #666;
    }

    .no-epass-message i {
      font-size: 48px;
      color: #ddd;
      margin-bottom: 15px;
    }

    .no-epass-message p {
      margin: 10px 0;
    }

    .no-epass-message a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .epass-error-message {
      padding: 20px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      color: #721c24;
      text-align: center;
    }

    @media print {
      .epass-tiles-container,
      .epass-actions,
      .close,
      .modal-content > .close {
        display: none;
      }

      .epass-qr-display {
        page-break-inside: avoid;
      }
    }
  `;
  document.head.appendChild(style);
}

// Load e-passes when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('myTicketsContainer');
  if (container) {
    loadUserEPasses();
  }
});
