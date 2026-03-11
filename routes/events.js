const express = require('express');
const Event = require('../models/Event');
const Participant = require('../models/Participant');
const User = require('../models/User');
const auth = require('../middleware/auth');
const XLSX = require('xlsx');

const router = express.Router();

// Get all events (public - for home page)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', '_id username').sort({ date: 1 });
    console.log('Events found:', events.length);
    res.json(events);
  } catch (err) {
    console.log('Error fetching events:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get events for organizer (filtered by tenantId)
router.get('/my-events', auth, async (req, res) => {
  try {
    // Get user info to get tenantId
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Use collegeName as tenantId, fallback to 'default' if not set
    const tenantId = user.collegeName || 'default';
    
    // Filter events by tenantId
    const events = await Event.find({ tenantId: tenantId })
      .populate('createdBy', '_id username')
      .sort({ date: 1 });
    
    console.log('Organizer events found:', events.length, 'for tenant:', tenantId);
    res.json(events);
  } catch (err) {
    console.log('Error fetching organizer events:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get registered events for logged-in user (tenant-scoped)
router.get('/registered', auth, async (req, res) => {
  try {
    // fetch user to determine tenant
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const tenantId = user.collegeName || 'default';

    // find participant records for this user (don't filter by tenantId since event may be from different tenant)
    const participants = await Participant.find({ user: req.user }).select('event').lean();
    // guard against incomplete participant documents
    const candidateIds = participants
      .map(p => p.event)
      .filter(id => id); // drop null/undefined values

    // further ensure each id is a valid Mongo ObjectId string
    const mongoose = require('mongoose');
    const eventIds = candidateIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (candidateIds.length !== eventIds.length) {
      console.warn('Filtered out invalid event IDs:', candidateIds.filter(id => !mongoose.Types.ObjectId.isValid(id)));
    }

    // if there are no valid event IDs, return early with empty list
    if (eventIds.length === 0) {
      return res.json([]);
    }

    // load the events themselves (don't filter by tenant - user may be registered for events from other tenants)
    const events = await Event.find({ _id: { $in: eventIds } })
      .populate('createdBy', '_id username')
      .populate({
        path: 'participants',
        populate: { path: 'user', select: '_id username' }
      });

    res.json(events);
  } catch (err) {
    console.error('Error fetching registered events:', err);
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint - check participant records
router.get('/debug/participants-check', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const tenantId = user?.collegeName || 'default';
    
    // Find all participants for this user
    const participants = await Participant.find({ user: req.user })
      .populate('event', 'title date')
      .populate('user', 'username email');
    
    // Also check if there are ANY participants at all in this tenant
    const allParticipants = await Participant.find({ tenantId: tenantId })
      .populate('event', 'title date')
      .populate('user', 'username');
    
    res.json({
      message: 'Debug info',
      currentUser: {
        userId: req.user,
        tenantId: tenantId,
        username: user?.username,
        collegeName: user?.collegeName
      },
      currentUserParticipants: participants.length,
      currentUserParticipantsList: participants,
      totalParticipantsInTenant: allParticipants.length,
      info: 'If currentUserParticipants is 0, user has not registered for any events yet.'
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'username').populate({
      path: 'participants',
      populate: {
        path: 'user',
        select: 'username email'
      }
    });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (protected)
router.post('/', auth, async (req, res) => {
  try {
    const { title, date, endDate, location, description, image, category, maxAttendees, tags, prerequisites, contactEmail, allowParticipation, customQuestions, enableEPass } = req.body;

    if (!title || !date || !location || !description || !category) {
      return res.status(400).json({ message: 'Missing required fields: title, date, location, description, and category are required.' });
    }

    // Get user info to set tenantId
    const user = await User.findById(req.user);
    const tenantId = user?.collegeName || 'default';
    const tenantName = user?.collegeName || 'General';

    const event = new Event({
      title,
      date,
      endDate: endDate || null,
      location,
      description,
      image: image || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgjc0tz9sqLK7Olr5plqVSxNhqPXxiO86QzA&s',
      category,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      tags: Array.isArray(tags) ? tags : (tags ? [].concat(tags) : []),
      prerequisites: prerequisites || '',
      contactEmail: contactEmail || '',
      allowParticipation: allowParticipation !== undefined ? !!allowParticipation : true,
      customQuestions: Array.isArray(customQuestions) ? customQuestions : [],
      enableEPass: !!enableEPass,
      createdBy: req.user,
      tenantId: tenantId,
      tenantName: tenantName,
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Update event (protected)
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user owns the event
    if (event.createdBy.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { title, date, endDate, location, description, image, category, maxAttendees, tags, prerequisites, contactEmail, allowParticipation, customQuestions, enableEPass } = req.body;
    event.title = title || event.title;
    event.date = date || event.date;
    if (endDate !== undefined) event.endDate = endDate;
    event.location = location || event.location;
    event.description = description || event.description;
    event.image = image || event.image;
    event.category = category || event.category;
    event.maxAttendees = maxAttendees ? parseInt(maxAttendees) : event.maxAttendees;
    event.tags = tags || event.tags;
    event.prerequisites = prerequisites || event.prerequisites;
    event.contactEmail = contactEmail || event.contactEmail;
    event.allowParticipation = allowParticipation !== undefined ? allowParticipation : event.allowParticipation;
    event.customQuestions = customQuestions || event.customQuestions;
    if (enableEPass !== undefined) event.enableEPass = !!enableEPass;

    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Register for event
router.post('/:id/register', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // optionally fetch user details for email or other info
    const user = await User.findById(req.user);

    // Check if user is a student (only students can register for events)
    if (user && user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can register for events. Admins and organizers cannot register.' });
    }

    // Check if participation is allowed
    if (!event.allowParticipation) {
      return res.status(400).json({ message: 'Participation is not allowed for this event' });
    }

    // Check if user is already a participant
    const existingParticipant = await Participant.findOne({ event: req.params.id, user: req.user });
    if (existingParticipant) {
      // Unregister - remove participant document and from event participants array
      await Participant.findByIdAndDelete(existingParticipant._id);
      event.participants = event.participants.filter(p => p.toString() !== existingParticipant._id.toString());
      await event.save();
      return res.json({ message: 'Successfully unregistered from event' });
    } else {
      // Register - create participant document and add to event participants array
      // build registration data by copying all non-custom keys
      const registrationData = {};
      for (const key in req.body) {
        if (key.startsWith('custom_')) continue;
        registrationData[key] = req.body[key];
      }
      // coerce checkbox values to booleans
      registrationData.termsAccepted = !!req.body.termsAccepted;
      registrationData.receiveUpdates = !!req.body.receiveUpdates;
      registrationData.wantsEPass = !!req.body.wantsEPass;

      // Determine required fields based on event category
      const requiredFields = ['studentName', 'phone'];
      const cat = (event.category || '').toLowerCase();
      if (['academic', 'workshop', 'seminar', 'tech'].includes(cat)) {
        requiredFields.push('rollNo', 'class', 'department', 'year');
      }
      if (['corporate','wedding','virtual','exhibition','cultural','social','other'].includes(cat)) {
        requiredFields.push('email');
      }
      // sports events don't need roll number; may optionally want teamName/jerseyNumber

      for (const field of requiredFields) {
        if (!registrationData[field]) {
          return res.status(400).json({ message: `${field} is required` });
        }
      }

      if (!registrationData.termsAccepted) {
        return res.status(400).json({ message: 'You must accept the terms and conditions' });
      }

      // Process custom question answers
      const customAnswers = [];
      if (event.customQuestions && event.customQuestions.length > 0) {
        for (const question of event.customQuestions) {
          const answer = req.body[`custom_${question._id}`];
          if (answer !== undefined && answer !== null && answer !== '') {
            customAnswers.push({
              questionId: question._id.toString(),
              question: question.question,
              answer: question.type === 'checkbox' ? (Array.isArray(answer) ? answer : [answer]) : answer,
            });
          }
        }
      }

      // ensure registrationData has defaults so participant schema won't complain
      registrationData.rollNo = registrationData.rollNo || '';
      registrationData.class = registrationData.class || '';
      registrationData.department = registrationData.department || '';
      registrationData.year = registrationData.year || '';

      const participant = new Participant({
        tenantId: event.tenantId || (user && user.collegeName) || 'default',
        event: req.params.id,
        user: req.user,
        registrationData: registrationData,
        customAnswers: customAnswers,
        registeredAt: new Date(),
      });

      await participant.save();
      event.participants.push(participant._id);
      await event.save();

      // Send registration confirmation email
      try {
        const { sendRegistrationConfirmationEmail } = require('../utils/emailService');
        
        // Get recipient email from registration data or user profile
        const recipientEmail = registrationData.email || (user && user.email);
        if (recipientEmail) {
          const emailResult = await sendRegistrationConfirmationEmail({
            recipientEmail: recipientEmail,
            recipientName: registrationData.studentName,
            eventTitle: event.title,
            eventDate: event.date,
            eventLocation: event.location,
            organizerName: event.createdBy?.username || 'Event Organizer',
            organizerEmail: event.contactEmail || (user && user.email) || 'events@eventsphere.com',
          });
          
          if (emailResult.success) {
            console.log('Registration confirmation email sent successfully');
          } else {
            console.error('Failed to send registration confirmation email:', emailResult.error);
          }
        } else {
          console.warn('No email found for registration confirmation');
        }
      } catch (emailError) {
        console.error('Error sending registration confirmation email:', emailError);
        // Continue with registration even if email fails
      }

      // Generate and send e-pass only if event has e-pass system enabled AND user requested it
      if (event.enableEPass && registrationData.wantsEPass) {
        try {
          const { generateEPass } = require('../utils/epassGenerator');
          const { sendEPassEmail } = require('../utils/emailService');
          
          // Email is required for e-pass delivery
          const recipientEmail = registrationData.email || (user && user.email);
          if (!recipientEmail) {
            console.warn('No email found for e-pass delivery');
          } else {
            const epassData = await generateEPass({
              participantName: registrationData.studentName,
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
            const EPass = require('../models/EPass');
            const epass = new EPass({
              eventId: event._id,
              participantId: participant._id,
              userId: req.user,
              token: epassData.token,
              qrCode: epassData.qrCode,
              status: 'generated',
              tenantId: event.tenantId,
            });

            await epass.save();

            // Send email with e-pass
            const emailResult = await sendEPassEmail({
              recipientEmail: recipientEmail,
              recipientName: registrationData.studentName,
              eventTitle: event.title,
              eventDate: event.date,
              eventLocation: event.location,
              epassHtmlContent: epassData.htmlContent,
              qrCodeDataUri: epassData.qrCode,
              organizerName: event.createdBy?.username || 'Event Organizer',
              organizerEmail: event.contactEmail || (user && user.email) || 'events@eventsphere.com',
            });

            // Update e-pass status if email sent successfully
            if (emailResult.success) {
              epass.status = 'sent';
              epass.sentAt = new Date();
              await epass.save();
            }
          }
        } catch (epassError) {
          console.error('Error generating/sending e-pass:', epassError);
          // Continue with registration even if e-pass generation fails
        }
      }

      return res.json({ 
        message: 'Successfully registered for event',
        participantId: participant._id,
        eventId: event._id,
        showEPassPopup: event.enableEPass === true, // Shows popup if E-Pass system is enabled
        userEmail: user ? user.email : null
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Submit feedback for event (protected)
router.post('/:id/feedback', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is a participant
    const participant = await Participant.findOne({ event: req.params.id, user: req.user });
    if (!participant) {
      return res.status(400).json({ message: 'You must be registered for this event to submit feedback' });
    }

    const { rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Update feedback
    participant.feedback = {
      rating: parseInt(rating),
      comment: comment || '',
      submittedAt: new Date(),
    };

    await participant.save();
    res.json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user owns the event
    if (event.createdBy.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Remove associated participants
    await Participant.deleteMany({ event: req.params.id });

    await event.remove();
    res.json({ message: 'Event removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Export participants to Excel (protected)
router.get('/:id/export-participants', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user owns the event
    if (event.createdBy.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Fetch participants with populated user data
    const participants = await Participant.find({ event: req.params.id }).populate('user', 'username email');

    // Prepare data for Excel
    const data = participants.map(participant => {
      const user = participant.user || {};
      const regData = participant.registrationData || {};
      const registeredAt = participant.registeredAt ? new Date(participant.registeredAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A';

      return {
        'Student Name': regData.studentName || user.username || 'N/A',
        'Roll Number': regData.rollNo || 'N/A',
        'Class': regData.class || 'N/A',
        'Team Name': regData.teamName || 'N/A',
        'Jersey Number': regData.jerseyNumber || 'N/A',
        'Company': regData.company || 'N/A',
        'Job Title': regData.jobTitle || 'N/A',
        'Email': regData.email || user.email || 'N/A',
        'Department': regData.department || 'N/A',
        'Year': regData.year || 'N/A',
        'Phone': regData.phone || 'N/A',
        'Dietary Requirements': regData.dietary || 'None',
        'Special Needs': regData.specialNeeds || 'None',
        'Terms Accepted': regData.termsAccepted ? 'Yes' : 'No',
        'Receive Updates': regData.receiveUpdates ? 'Yes' : 'No',
        'Registered At': registeredAt
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const colWidths = [
      { wch: 15 }, // Student Name
      { wch: 12 }, // Roll Number
      { wch: 10 }, // Class
      { wch: 15 }, // Team Name
      { wch: 12 }, // Jersey Number
      { wch: 15 }, // Company
      { wch: 12 }, // Job Title
      { wch: 25 }, // Email
      { wch: 15 }, // Department
      { wch: 8 },  // Year
      { wch: 12 }, // Phone
      { wch: 20 }, // Dietary
      { wch: 15 }, // Special Needs
      { wch: 12 }, // Terms
      { wch: 12 }, // Updates
      { wch: 15 }  // Registered At
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Participants');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    const filename = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_participants.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// endpoint to manually mark an event ended (sets endDate to now)
router.put('/:id/end', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    // check ownership
    if (event.createdBy.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    event.endDate = new Date();
    await event.save();
    res.json(event);
  } catch (err) {
    console.error('End event error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
