const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const EPass = require('../models/EPass');
const Participant = require('../models/Participant');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateEPass, generateEPassHTML } = require('../utils/epassGenerator');
const { sendEPassEmail } = require('../utils/emailService');

/**
 * POST /api/epasses
 * Generate a new e-pass for a participant
 */
router.post('/', auth, async (req, res) => {
  try {
    const { participantId, eventId } = req.body;

    // Validate inputs
    if (!participantId || !eventId) {
      return res.status(400).json({ error: 'Missing participantId or eventId' });
    }

    // Fetch participant and event details
    const participant = await Participant.findById(participantId).populate('user event');
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const event = await Event.findById(eventId).populate('createdBy');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if e-pass already exists and is not cancelled
    const existingEPass = await EPass.findOne({
      participantId,
      eventId,
      status: { $ne: 'cancelled' },
    });

    if (existingEPass) {
      return res.status(400).json({ error: 'E-pass already exists for this participant' });
    }

    // Generate e-pass
    const epassData = await generateEPass({
      participantName: participant.registrationData.studentName,
      eventId: event._id.toString(),
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      eventCategory: event.category,
      organizerName: event.createdBy?.username || 'Event Organizer',
      seatNumber: null,
      brandColorPrimary: event.brandColorPrimary,
      brandColorSecondary: event.brandColorSecondary,
    });

    // Save e-pass to database
    const epass = new EPass({
      eventId,
      participantId,
      userId: participant.user._id,
      token: epassData.token,
      qrCode: epassData.qrCode,
      status: 'generated',
      tenantId: event.tenantId,
    });

    await epass.save();

    // Send email with e-pass
    const emailResult = await sendEPassEmail({
      recipientEmail: participant.user.email,
      recipientName: participant.registrationData.studentName,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      epassHtmlContent: epassData.htmlContent,
      qrCodeDataUri: epassData.qrCode,
      organizerName: event.createdBy?.username || 'Event Organizer',
      organizerEmail: event.contactEmail || event.createdBy?.email || 'events@eventsphere.com',
    });

    // Update e-pass status if email sent successfully
    if (emailResult.success) {
      epass.status = 'sent';
      epass.sentAt = new Date();
      await epass.save();
    }

    res.status(201).json({
      success: true,
      message: 'E-pass generated and sent successfully',
      epass: {
        id: epass._id,
        token: epass.token.substring(0, 16) + '...',
        status: epass.status,
        sentAt: epass.sentAt,
      },
      emailResult,
    });
  } catch (error) {
    console.error('Error generating e-pass:', error);
    res.status(500).json({ error: 'Failed to generate e-pass', details: error.message });
  }
});

/**
 * GET /api/epasses
 * Fetch e-passes with filter by eventId and/or token
 */
router.get('/', auth, async (req, res) => {
  try {
    const { eventId, token } = req.query;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const filter = { eventId };
    if (token) {
      filter.token = token;
    }

    const epasses = await EPass.find(filter)
      .populate({
        path: 'participantId',
        select: 'registrationData',
      })
      .populate({
        path: 'userId',
        select: 'email username',
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      epasses: epasses.map(epass => ({
        _id: epass._id,
        token: epass.token,
        status: epass.status,
        verifiedAt: epass.verifiedAt,
        participantId: {
          registrationData: epass.participantId?.registrationData || {},
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching e-passes:', error);
    res.status(500).json({ error: 'Failed to fetch e-passes', details: error.message });
  }
});

/**
 * GET /api/epasses/user/my-tickets
 * Get all e-passes for the current user across all events
 */
router.get('/user/my-tickets', auth, async (req, res) => {
  try {
    const userId = req.user;
    console.log('Fetching e-passes for userId:', userId);

    if (!userId) {
      console.warn('No userId found on request, aborting ticket lookup');
      return res.status(401).json({ error: 'Unauthorized - missing user id' });
    }

    const epasses = await EPass.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate({
        path: 'eventId',
        select: 'title date location category image description',
      })
      .populate({
        path: 'participantId',
        select: 'registrationData',
      })
      .sort({ createdAt: -1 });

    const tickets = epasses.map(epass => ({
      id: epass._id,
      eventId: epass.eventId?._id,
      eventTitle: epass.eventId?.title || 'Unknown event',
      eventDate: epass.eventId?.date,
      eventLocation: epass.eventId?.location || 'TBA',
      eventCategory: epass.eventId?.category || 'general',
      eventImage: epass.eventId?.image,
      participantName: epass.participantId?.registrationData?.studentName || '',
      status: epass.status,
      token: epass.token,
      qrCode: epass.qrCode,
      createdAt: epass.createdAt,
      sentAt: epass.sentAt,
      verifiedAt: epass.verifiedAt,
    }));

    res.json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error('Error fetching user e-passes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch e-passes', 
      details: error.message 
    });
  }
});

/**
 * GET /api/epasses/:id
 * Fetch e-pass details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    const epass = await EPass.findById(id)
      .populate({
        path: 'eventId',
        select: 'title date location category description image',
      })
      .populate({
        path: 'participantId',
        select: 'registrationData',
      })
      .populate({
        path: 'userId',
        select: 'email username',
      });

    if (!epass) {
      return res.status(404).json({ error: 'E-pass not found' });
    }

    // Verify token if provided (optional security)
    if (token && epass.token !== token) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    res.json({
      id: epass._id,
      eventTitle: epass.eventId?.title,
      eventDate: epass.eventId?.date,
      eventLocation: epass.eventId?.location,
      eventCategory: epass.eventId?.category,
      participantName: epass.participantId?.registrationData?.studentName,
      userEmail: epass.userId?.email,
      qrCode: epass.qrCode,
      status: epass.status,
      createdAt: epass.createdAt,
      sentAt: epass.sentAt,
      verifiedAt: epass.verifiedAt,
    });
  } catch (error) {
    console.error('Error fetching e-pass:', error);
    res.status(500).json({ error: 'Failed to fetch e-pass', details: error.message });
  }
});

/**
 * POST /api/epasses/:id/verify
 * Verify e-pass (mark as used at check-in)
 */
router.post('/:id/verify', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const epass = await EPass.findById(id);
    if (!epass) {
      return res.status(404).json({ error: 'E-pass not found' });
    }

    // Verify token
    if (epass.token !== token) {
      return res.status(403).json({ error: 'Invalid e-pass token' });
    }

    // Check if already verified
    if (epass.status === 'used') {
      return res.status(400).json({ error: 'E-pass has already been used', verifiedAt: epass.verifiedAt });
    }

    // Mark as verified/used
    epass.status = 'used';
    epass.verifiedAt = new Date();
    await epass.save();

    res.json({
      success: true,
      message: 'E-pass verified successfully',
      epass: {
        id: epass._id,
        status: epass.status,
        verifiedAt: epass.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Error verifying e-pass:', error);
    res.status(500).json({ error: 'Failed to verify e-pass', details: error.message });
  }
});

/**
 * POST /api/epasses/:id/resend
 * Resend e-pass email
 */
router.post('/:id/resend', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const epass = await EPass.findById(id)
      .populate({
        path: 'eventId',
        select: 'title date location category createdBy contactEmail',
        populate: { path: 'createdBy', select: 'username email' },
      })
      .populate({
        path: 'participantId',
        select: 'registrationData user',
        populate: { path: 'user', select: 'email' },
      });

    if (!epass) {
      return res.status(404).json({ error: 'E-pass not found' });
    }

    if (!epass.qrCode) {
      return res.status(400).json({ error: 'E-pass QR code not available' });
    }

    // Generate HTML content from existing data
    const { generateEPassHTML } = require('../utils/epassGenerator');
    const htmlContent = generateEPassHTML({
      participantName: epass.participantId?.registrationData?.studentName,
      eventTitle: epass.eventId?.title,
      eventDate: epass.eventId?.date,
      eventLocation: epass.eventId?.location,
      eventCategory: epass.eventId?.category,
      token: epass.token,
      qrCodeDataUri: epass.qrCode,
      organizerName: epass.eventId?.createdBy?.username,
      seatNumber: null,
    });

    // Resend email
    const emailResult = await sendEPassEmail({
      recipientEmail: epass.participantId?.user?.email,
      recipientName: epass.participantId?.registrationData?.studentName,
      eventTitle: epass.eventId?.title,
      eventDate: epass.eventId?.date,
      eventLocation: epass.eventId?.location,
      epassHtmlContent: htmlContent,
      qrCodeDataUri: epass.qrCode,
      organizerName: epass.eventId?.createdBy?.username,
      organizerEmail: epass.eventId?.contactEmail || epass.eventId?.createdBy?.email,
    });

    // Update sent timestamp
    if (emailResult.success) {
      epass.sentAt = new Date();
      await epass.save();
    }

    res.json({
      success: true,
      message: 'E-pass sent successfully',
      emailResult,
    });
  } catch (error) {
    console.error('Error resending e-pass:', error);
    res.status(500).json({ error: 'Failed to resend e-pass', details: error.message });
  }
});

/**
 * GET /api/epasses/event/:eventId
 * Get all e-passes for an event
 */
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    const epasses = await EPass.find({ eventId })
      .populate({
        path: 'participantId',
        select: 'registrationData',
      })
      .populate({
        path: 'userId',
        select: 'email username',
      })
      .sort({ createdAt: -1 });

    const stats = {
      total: epasses.length,
      sent: epasses.filter(e => e.status === 'sent').length,
      used: epasses.filter(e => e.status === 'used').length,
      cancelled: epasses.filter(e => e.status === 'cancelled').length,
    };

    res.json({
      stats,
      epasses: epasses.map(e => ({
        id: e._id,
        participantName: e.participantId?.registrationData?.studentName,
        userEmail: e.userId?.email,
        status: e.status,
        createdAt: e.createdAt,
        sentAt: e.sentAt,
        verifiedAt: e.verifiedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching event e-passes:', error);
    res.status(500).json({ error: 'Failed to fetch e-passes', details: error.message });
  }
});

/**
 * POST /api/epasses/send-for-registration
 * Send E-Pass email after event registration (popup confirmation)
 */
router.post('/send-for-registration', auth, async (req, res) => {
  try {
    const { participantId, eventId } = req.body;

    // Validate inputs
    if (!participantId || !eventId) {
      return res.status(400).json({ 
        error: 'Missing required fields: participantId and eventId' 
      });
    }

    // Fetch participant and event details
    const participant = await Participant.findById(participantId).populate('user event');
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const event = await Event.findById(eventId).populate('createdBy');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if e-pass already exists
    let epass = await EPass.findOne({
      participantId,
      eventId,
      status: { $ne: 'cancelled' },
    });

    // If not, generate one
    if (!epass) {
      const epassData = await generateEPass({
        participantName: participant.registrationData.studentName,
        eventId: event._id.toString(),
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        eventCategory: event.category,
        organizerName: event.createdBy?.username || 'Event Organizer',
        seatNumber: null,
        brandColorPrimary: event.brandColorPrimary,
        brandColorSecondary: event.brandColorSecondary,
      });

      epass = new EPass({
        eventId,
        participantId,
        userId: req.user,
        token: epassData.token,
        qrCode: epassData.qrCode,
        status: 'generated',
        tenantId: event.tenantId,
      });

      await epass.save();
    }

    // Get recipient email
    const recipientEmail = participant.registrationData.email || participant.user.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'No email address found for E-Pass delivery' });
    }

    // Send email
    const emailResult = await sendEPassEmail({
      recipientEmail: recipientEmail,
      recipientName: participant.registrationData.studentName,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      epassHtmlContent: generateEPassHTML({
        participantName: participant.registrationData.studentName,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        eventCategory: event.category,
        token: epass.token,
        qrCodeDataUri: epass.qrCode,
        organizerName: event.createdBy?.username || 'Event Organizer',
        seatNumber: null,
      }),
      qrCodeDataUri: epass.qrCode,
      organizerName: event.createdBy?.username || 'Event Organizer',
      organizerEmail: event.contactEmail || event.createdBy?.email || 'events@eventsphere.com',
    });

    // Update e-pass status
    if (emailResult.success) {
      epass.status = 'sent';
      epass.sentAt = new Date();
      await epass.save();
    }

    res.json({
      success: true,
      message: `E-pass sent successfully to ${recipientEmail}`,
      epass: {
        id: epass._id,
        status: epass.status,
        sentTo: recipientEmail,
        sentAt: epass.sentAt,
      },
    });
  } catch (error) {
    console.error('Error sending e-pass:', error);
    res.status(500).json({ 
      error: 'Failed to send e-pass', 
      details: error.message 
    });
  }
});

module.exports = router;
