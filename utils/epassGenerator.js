const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Get color scheme based on event category
 */
function getCategoryColorScheme(category, brandColorPrimary, brandColorSecondary) {
  const schemes = {
    'technology': {
      primary: brandColorPrimary || '#00D4FF',
      secondary: brandColorSecondary || '#0099CC',
      accent: '#1a1a2e',
      icon: '💻',
      pattern: 'tech'
    },
    'sports': {
      primary: brandColorPrimary || '#FF6B6B',
      secondary: brandColorSecondary || '#EE5A6F',
      accent: '#FFD93D',
      icon: '⚽',
      pattern: 'sports'
    },
    'cultural': {
      primary: brandColorPrimary || '#FFD700',
      secondary: brandColorSecondary || '#FFA500',
      accent: '#FF6B9D',
      icon: '🎭',
      pattern: 'cultural'
    },
    'wedding': {
      primary: brandColorPrimary || '#FF69B4',
      secondary: brandColorSecondary || '#FFB6C1',
      accent: '#FFFFFF',
      icon: '💒',
      pattern: 'wedding'
    },
    'corporate': {
      primary: brandColorPrimary || '#1A365D',
      secondary: brandColorSecondary || '#2D3748',
      accent: '#4299E1',
      icon: '💼',
      pattern: 'corporate'
    },
    'social': {
      primary: brandColorPrimary || '#51CF66',
      secondary: brandColorSecondary || '#37B24D',
      accent: '#69DB7C',
      icon: '🎉',
      pattern: 'social'
    },
    'virtual': {
      primary: brandColorPrimary || '#9775FA',
      secondary: brandColorSecondary || '#7950F2',
      accent: '#E5CCFF',
      icon: '🌐',
      pattern: 'virtual'
    },
    'exhibition': {
      primary: brandColorPrimary || '#FF922B',
      secondary: brandColorSecondary || '#F76707',
      accent: '#FFE066',
      icon: '🖼️',
      pattern: 'exhibition'
    }
  };

  return schemes[category.toLowerCase()] || schemes['technology'];
}

/**
 * Generate a unique secure token for e-pass
 */
function generateEPassToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate QR code as data URI
 * @param {Object} data - Data to encode in QR code
 * @returns {Promise<string>} QR code as data URI
 */
async function generateQRCode(data) {
  try {
    const qrString = JSON.stringify(data);
    const qrDataUri = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrDataUri;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate E-Pass HTML template with event-specific design
 * @param {Object} epassData - E-pass information
 * @returns {string} HTML content for e-pass
 */
function generateEPassHTML(epassData) {
  const {
    participantName,
    eventTitle,
    eventDate,
    eventLocation,
    eventCategory,
    token,
    qrCodeDataUri,
    organizerName,
    seatNumber,
    brandColorPrimary,
    brandColorSecondary,
  } = epassData;

  // Get color scheme based on category
  const colors = getCategoryColorScheme(eventCategory, brandColorPrimary, brandColorSecondary);

  const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event E-Pass - ${eventTitle}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        .epass-container {
          width: 100%;
          max-width: 650px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          position: relative;
        }
        
        .epass-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%);
        }

        .epass-header {
          background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .epass-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }

        .epass-header-content {
          position: relative;
          z-index: 1;
        }

        .epass-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .epass-header h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .epass-header p {
          font-size: 14px;
          opacity: 0.95;
          font-weight: 500;
        }

        .epass-body {
          padding: 45px 35px;
        }

        .epass-participant-section {
          margin-bottom: 35px;
          padding-bottom: 25px;
          border-bottom: 2px solid #f0f0f0;
        }

        .epass-participant-name {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .epass-participant-value {
          font-size: 24px;
          color: #1a1a1a;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .epass-event-section {
          margin-bottom: 30px;
        }

        .epass-section-title {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
          margin-bottom: 15px;
        }

        .epass-event-title {
          font-size: 22px;
          color: #1a1a1a;
          font-weight: 800;
          margin-bottom: 20px;
          line-height: 1.3;
        }

        .epass-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 25px;
        }

        .epass-detail-item {
          background: linear-gradient(135deg, ${colors.primary}08 0%, ${colors.secondary}08 100%);
          border: 1.5px solid ${colors.primary}20;
          padding: 18px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .epass-detail-item:hover {
          border-color: ${colors.primary}40;
          background: linear-gradient(135deg, ${colors.primary}12 0%, ${colors.secondary}12 100%);
        }

        .epass-detail-label {
          font-size: 10px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .epass-detail-value {
          font-size: 15px;
          color: #1a1a1a;
          font-weight: 700;
          word-wrap: break-word;
        }

        .epass-qr-section {
          background: linear-gradient(135deg, ${colors.primary}05 0%, ${colors.secondary}05 100%);
          border: 2px solid ${colors.primary}20;
          border-radius: 16px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }

        .epass-qr-image {
          max-width: 280px;
          height: auto;
          margin-bottom: 20px;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1));
        }

        .epass-qr-label {
          font-size: 13px;
          color: #666;
          margin-bottom: 12px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .epass-token-display {
          background: white;
          border: 1px solid #ddd;
          padding: 12px 16px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #666;
          word-break: break-all;
          line-height: 1.6;
        }

        .epass-instructions {
          background: ${colors.primary}08;
          border-left: 4px solid ${colors.primary};
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }

        .epass-instructions-title {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .epass-instructions-text {
          font-size: 14px;
          color: #555;
          line-height: 1.8;
        }

        .epass-instructions-text li {
          margin-bottom: 8px;
        }

        .epass-badge {
          display: inline-block;
          background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 13px;
          font-weight: 700;
          margin-top: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 15px ${colors.primary}30;
        }

        .epass-footer {
          background: #f8f9fa;
          padding: 25px 35px;
          text-align: center;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #999;
        }

        .epass-footer-text {
          margin: 5px 0;
        }

        .epass-organizer {
          margin-top: 12px;
          font-weight: 600;
          color: #666;
        }

        @media print {
          body {
            background: white;
            padding: 0;
          }
          .epass-container {
            box-shadow: none;
            width: 100%;
            max-width: 100%;
            border-radius: 0;
          }
          .epass-container::before {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="epass-container">
        <div class="epass-header">
          <div class="epass-header-content">
            <div class="epass-icon">${colors.icon}</div>
            <h1>ADMIT ONE</h1>
            <p>Event E-Pass</p>
          </div>
        </div>

        <div class="epass-body">
          <!-- Participant Name -->
          <div class="epass-participant-section">
            <div class="epass-participant-name">Participant</div>
            <div class="epass-participant-value">${participantName}</div>
          </div>

          <!-- Event Details -->
          <div class="epass-event-section">
            <div class="epass-section-title">Event</div>
            <div class="epass-event-title">${eventTitle}</div>

            <div class="epass-details-grid">
              <div class="epass-detail-item">
                <div class="epass-detail-label">📅 Date & Time</div>
                <div class="epass-detail-value">${formattedDate}</div>
              </div>
              <div class="epass-detail-item">
                <div class="epass-detail-label">📍 Location</div>
                <div class="epass-detail-value">${eventLocation}</div>
              </div>
              ${seatNumber ? `
              <div class="epass-detail-item">
                <div class="epass-detail-label">🎫 Seat</div>
                <div class="epass-detail-value">${seatNumber}</div>
              </div>
              ` : ''}
              <div class="epass-detail-item">
                <div class="epass-detail-label">📂 Category</div>
                <div class="epass-detail-value">${eventCategory}</div>
              </div>
            </div>
          </div>

          <!-- QR Code -->
          <div class="epass-qr-section">
            <img src="${qrCodeDataUri}" alt="QR Code" class="epass-qr-image">
            <div class="epass-qr-label">Scan at event entrance</div>
            <div class="epass-token-display">
              Token: ${token.substring(0, 20)}...
            </div>
          </div>

          <!-- Instructions -->
          <div class="epass-instructions">
            <div class="epass-instructions-title">Important Instructions</div>
            <div class="epass-instructions-text">
              ✓ Show this QR code at the event entrance<br>
              ✓ Keep this ticket safe and secure<br>
              ✓ Arrive 15 minutes early<br>
              ✓ Contact: ${organizerName}
            </div>
            <div class="epass-badge">✓ VALID TICKET</div>
          </div>
        </div>

        <div class="epass-footer">
          <div class="epass-footer-text">Generated: ${new Date().toLocaleDateString('en-US')} at ${new Date().toLocaleTimeString('en-US')}</div>
          <div class="epass-organizer">Organized by ${organizerName}</div>
          <div class="epass-footer-text" style="margin-top: 15px; font-size: 11px;">© EventSphere 2026 | All rights reserved</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate E-Pass for a participant
 * @param {Object} param0 - Parameters
 * @returns {Promise<Object>} Generated e-pass data
 */
async function generateEPass({
  participantName,
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  eventCategory,
  organizerName,
  seatNumber = null,
  brandColorPrimary = null,
  brandColorSecondary = null,
}) {
  try {
    // Generate unique token
    const token = generateEPassToken();

    // Generate QR code data
    const qrData = {
      eventId,
      token,
      participantName,
      timestamp: new Date().getTime(),
    };

    // Generate QR code as data URI
    const qrCodeDataUri = await generateQRCode(qrData);

    // Generate HTML with brand colors
    const htmlContent = generateEPassHTML({
      participantName,
      eventTitle,
      eventDate,
      eventLocation,
      eventCategory,
      token,
      qrCodeDataUri,
      organizerName,
      seatNumber,
      brandColorPrimary,
      brandColorSecondary,
    });

    return {
      token,
      qrCode: qrCodeDataUri,
      htmlContent,
    };
  } catch (error) {
    console.error('Error generating e-pass:', error);
    throw error;
  }
}

/**
 * Verify E-Pass token
 * @param {string} token - Token to verify
 * @param {string} eventId - Event ID to verify against
 * @returns {boolean} Whether token is valid
 */
function verifyEPassToken(token, eventId) {
  // Token format: hex string of 64 characters (32 bytes in hex)
  return /^[a-f0-9]{64}$/.test(token);
}

module.exports = {
  generateEPass,
  generateEPassToken,
  generateQRCode,
  generateEPassHTML,
  verifyEPassToken,
};
