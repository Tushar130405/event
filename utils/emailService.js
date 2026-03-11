const nodemailer = require('nodemailer');

// Configure your email service here (Gmail, Sendgrid, etc.)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send e-pass to participant via email
 * @param {Object} param0 - Parameters
 * @returns {Promise<Object>} Result of email sending
 */
async function sendEPassEmail({
  recipientEmail,
  recipientName,
  eventTitle,
  eventDate,
  eventLocation,
  epassHtmlContent,
  qrCodeDataUri,
  organizerName,
  organizerEmail,
}) {
  try {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Event E-Pass</title>
        <style>
          body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section h3 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .event-details {
            background: #f5f5f5;
            padding: 15px;
            border-left: 4px solid #667eea;
            margin: 15px 0;
          }
          .event-details p {
            margin: 8px 0;
          }
          .event-details strong {
            color: #333;
          }
          .qr-section {
            text-align: center;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
            margin: 20px 0;
          }
          .qr-section img {
            max-width: 200px;
            height: auto;
          }
          .qr-label {
            font-size: 12px;
            color: #999;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
            text-align: center;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
            font-weight: 600;
          }
          .instructions {
            background: #fffbf0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
          }
          .instructions li {
            margin: 8px 0 8px 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Your Event E-Pass</h1>
            <p>Your digital admission ticket is ready!</p>
          </div>
          <div class="content">
            <div class="section">
              <p>Hi <strong>${recipientName}</strong>,</p>
              <p>Thank you for registering for our event! Your e-pass is attached and ready to use.</p>
            </div>

            <div class="section">
              <h3>📅 Event Details</h3>
              <div class="event-details">
                <p><strong>Event:</strong> ${eventTitle}</p>
                <p><strong>Date & Time:</strong> ${formattedDate}</p>
                <p><strong>Location:</strong> ${eventLocation}</p>
                <p><strong>Organizer:</strong> ${organizerName}</p>
              </div>
            </div>

            <div class="qr-section">
              <img src="${qrCodeDataUri}" alt="Event QR Code">
              <div class="qr-label">Scan this QR code at the event entrance</div>
            </div>

            <div class="section instructions">
              <h4>📋 Important Instructions:</h4>
              <ul>
                <li>Present this e-pass at the event entrance by scanning the QR code</li>
                <li>Bring a valid ID for verification</li>
                <li>Arrive 15 minutes before the event start time</li>
                <li>Keep your e-pass safe and don't share with others</li>
                <li>Check the event website for any last-minute updates</li>
              </ul>
            </div>

            <div class="section">
              <p><strong>Need help?</strong></p>
              <p>If you have any questions or concerns, please contact the event organizer:</p>
              <p><strong>Email:</strong> <a href="mailto:${organizerEmail}">${organizerEmail}</a></p>
            </div>

            <div class="footer">
              <p>This email contains your unique e-pass. Please keep it safe.</p>
              <p>© EventSphere 2026. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"${organizerName || 'EventSphere'}" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Your E-Pass for ${eventTitle}`,
      html: emailContent,
      attachments: [
        {
          filename: `epass-${Date.now()}.html`,
          content: epassHtmlContent,
          contentType: 'text/html',
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId,
      response: result.response,
    };
  } catch (error) {
    console.error('Error sending e-pass email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify SMTP connection
 */
async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('✓ Email service is configured and working');
    return true;
  } catch (error) {
    console.error('✗ Email service configuration error:', error);
    return false;
  }
}

/**
 * Send registration confirmation email to participant
 * @param {Object} param0 - Parameters
 * @returns {Promise<Object>} Result of email sending
 */
async function sendRegistrationConfirmationEmail({
  recipientEmail,
  recipientName,
  eventTitle,
  eventDate,
  eventLocation,
  organizerName,
  organizerEmail,
}) {
  try {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Confirmation</title>
        <style>
          body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #4CAF50;
            margin: 0;
          }
          .event-details {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .event-details h2 {
            margin-top: 0;
            color: #333;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Registration Confirmed!</h1>
            <p>You have successfully registered for an event.</p>
          </div>
          
          <div class="event-details">
            <h2>Event Details</h2>
            <p><strong>Event:</strong> ${eventTitle}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Location:</strong> ${eventLocation}</p>
            <p><strong>Organizer:</strong> ${organizerName}</p>
          </div>
          
          <p>Thank you for registering! We look forward to seeing you at the event.</p>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you have any questions, contact the event organizer at ${organizerEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending registration confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send OTP for email verification
 * @param {string} recipientEmail - Email address to send OTP to
 * @param {string} otp - One-time password
 * @returns {Promise<Object>} Result of email sending
 */
async function sendOTPEmail(recipientEmail, otp) {
  try {
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification OTP</title>
        <style>
          body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .otp-box {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
            border: 2px solid #667eea;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #667eea;
            font-family: 'Courier New', monospace;
          }
          .expiry-note {
            color: #666;
            font-size: 14px;
            margin-top: 15px;
            text-align: center;
          }
          .footer-note {
            color: #999;
            font-size: 12px;
            margin-top: 20px;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
            <p>Your OTP for Admin Registration</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for registering as an administrator. Please use the following One-Time Password (OTP) to verify your email address:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p class="expiry-note">This OTP is valid for 10 minutes</p>
            </div>
            <p>If you didn't request this OTP, please ignore this email.</p>
            <p>Do not share this OTP with anyone.</p>
            <div class="footer-note">
              <p>&copy; 2024 Global Events. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: 'Email Verification OTP - Admin Registration',
      html: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEPassEmail,
  sendRegistrationConfirmationEmail,
  verifyEmailConnection,
  sendOTPEmail,
  transporter,
};
