const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// MongoDB connection
const rawUri = process.env.MONGODB_URI;
try {
  const shortUri = rawUri ? (rawUri.includes('@') ? rawUri.split('@')[1] : rawUri) : 'MONGODB_URI not set';
  console.log('Connecting to MongoDB at:', shortUri);
} catch (err) {
  console.log('Connecting to MongoDB (unable to parse MONGODB_URI)');
}

if (!rawUri) {
  console.error('MONGODB_URI is not defined in environment. Connection will fail until configured.');
}

mongoose.connect(rawUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/epasses', require('./routes/epasses'));
app.use('/api/feedback', require('./routes/feedback'));



// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { sendRegistrationConfirmationEmail, verifyEmailConnection } = require('./utils/emailService');
    
    const { email, testMode } = req.body;
    
    if (testMode) {
      // Test mode - just validate the function without sending or checking connection
      console.log('Test mode: Validating email function with dummy data...');
      // Temporarily mock the transporter to avoid actual sending
      const originalSendMail = require('./utils/emailService').transporter.sendMail;
      require('./utils/emailService').transporter.sendMail = async (mailOptions) => {
        console.log('Mock email sent:', mailOptions.subject);
        return { messageId: 'test-message-id-' + Date.now() };
      };
      
      const result = await sendRegistrationConfirmationEmail({
        recipientEmail: email || 'test@example.com',
        recipientName: 'Test User',
        eventTitle: 'Test Event - Email Verification',
        eventDate: new Date(),
        eventLocation: 'Test Location',
        organizerName: 'Event Organizer',
        organizerEmail: 'organizer@example.com',
      });
      
      // Restore original function
      require('./utils/emailService').transporter.sendMail = originalSendMail;
      
      return res.json({ 
        success: result.success, 
        message: result.success ? 'Email function works correctly (test mode)' : 'Email function failed',
        error: result.error,
        note: 'This is a test mode result. Configure real email credentials to send actual emails.'
      });
    }
    
    // Normal mode - verify connection first
    const isConnected = await verifyEmailConnection();
    if (!isConnected) {
      return res.status(500).json({ 
        success: false, 
        message: 'Email service not configured properly. Please check EMAIL_USER and EMAIL_PASSWORD in .env file.' 
      });
    }
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    
    // Send test registration confirmation email
    const result = await sendRegistrationConfirmationEmail({
      recipientEmail: email,
      recipientName: 'Test User',
      eventTitle: 'Test Event - Email Verification',
      eventDate: new Date(),
      eventLocation: 'Test Location',
      organizerName: 'Event Organizer',
      organizerEmail: 'organizer@example.com',
    });
    
    if (result.success) {
      res.json({ success: true, message: 'Test email sent successfully!', messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email', error: result.error });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
