const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/emailService');

const router = express.Router();
console.log('Auth routes module loaded - registering routes...');

// Function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Store OTP in temporary collection or cache
    // For now, we'll create a temporary unverified user document
    let tempUser = await User.findOne({ email, emailVerified: false });
    
    if (!tempUser) {
      tempUser = new User({
        email,
        otpCode: otp,
        otpExpiry,
        emailVerified: false,
        username: '',
        password: '',
        role: 'admin'
      });
    } else {
      tempUser.otpCode = otp;
      tempUser.otpExpiry = otpExpiry;
    }
    
    await tempUser.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send OTP email', error: emailResult.error });
    }

    res.json({ 
      message: 'OTP sent to your email. Valid for 10 minutes.',
      success: true 
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find user with matching OTP
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or OTP' });
    }

    if (!user.otpCode || user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ 
      message: 'Email verified successfully. You can now complete your registration.',
      success: true,
      email: email
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Register - handle both student signups (direct) and other roles (OTP flow)
router.post('/register', async (req, res) => {
  try {
    const {
      role,
      username,
      email,
      organizationType,
      collegeName,
      department,
      mobileNo,
      password,
    } = req.body;

    console.log('Registration request body:', req.body);
    console.log('Role received:', role, '| Type:', typeof role);

    // Normalize role (handle case, whitespace, undefined)
    const normalizedRole = (role || 'student').trim().toLowerCase();
    console.log('Normalized role:', normalizedRole);

    // simple student registration path (no email verification step)
    if (normalizedRole === 'student') {
      console.log('✓ Student registration path triggered');
      // basic validation
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email and password are required' });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email is already registered' });
      }

      const newUser = new User({
        role: 'student',
        username,
        email,
        collegeName,
        department,
        mobileNo,
        password,
        emailVerified: false, // email verification is optional, can be done later in profile
      });

      await newUser.save();

      const payload = { userId: newUser._id, role: newUser.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

      console.log('✓ Student account created successfully');
      return res.status(201).json({ token, user: { id: newUser._id, username, email } });
    }

    // other roles (admin/teacher/staff/volunteer) must follow OTP verification

    console.log('⚠ Non-student role detected:', normalizedRole);
    console.log('Checking for pre-verified OTP user...');

    // Check if user exists with verified email
    let user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({ message: 'Email not found. Please verify your email first.' });
    }

    if (!user.emailVerified) {
      return res.status(400).json({ message: 'Email is not verified. Please verify your email first.' });
    }

    // Update user with registration details
    user.role = role || 'admin';
    user.username = username;
    user.organizationType = organizationType;
    user.mobileNo = mobileNo;
    user.password = password;
    
    await user.save();

    // Create token
    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required',
        error: 'Missing credentials'
      });
    }

    // Trim and validate email format
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@')) {
      return res.status(400).json({ 
        message: 'Invalid email format',
        error: 'Invalid email'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid email or password',
        error: 'User not found'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Invalid email or password',
        error: 'Invalid password'
      });
    }

    // Create token
    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Server error occurred',
      error: err.message 
    });
  }
});

// Get user profile (protected)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (protected)
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, organizationType, mobileNo } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user,
      { username, organizationType, mobileNo },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add to favorites (protected)
router.post('/favorites/:eventId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.favorites.includes(req.params.eventId)) {
      user.favorites.push(req.params.eventId);
      await user.save();
    }
    res.json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove from favorites (protected)
router.delete('/favorites/:eventId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.favorites = user.favorites.filter(id => id.toString() !== req.params.eventId);
    await user.save();
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
