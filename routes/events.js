const express = require('express');
const Event = require('../models/Event');
const Participant = require('../models/Participant');
const auth = require('../middleware/auth');
const XLSX = require('xlsx');

const router = express.Router();

// Get all events
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
    const { title, date, location, description, image, category, maxAttendees, tags, prerequisites, contactEmail, allowParticipation } = req.body;
    const event = new Event({
      title,
      date,
      location,
      description,
      image: image || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgjc0tz9sqLK7Olr5plqVSxNhqPXxiO86QzA&s',
      category,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      tags: tags || [],/*  */
      prerequisites: prerequisites || '',
      contactEmail: contactEmail || '',
      allowParticipation: allowParticipation || false,
      createdBy: req.user,
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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

    const { title, date, location, description, image, category, maxAttendees, tags, prerequisites, contactEmail, allowParticipation, customQuestions } = req.body;
    event.title = title || event.title;
    event.date = date || event.date;
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
      const registrationData = {
        studentName: req.body.studentName,
        rollNo: req.body.rollNo,
        class: req.body.class,
        phone: req.body.phone,
        department: req.body.department,
        year: req.body.year,
        dietary: req.body.dietary,
        specialNeeds: req.body.specialNeeds,
        termsAccepted: req.body.termsAccepted || false,
        receiveUpdates: req.body.receiveUpdates || false,
      };

      // Validate required fields
      if (!registrationData.studentName || !registrationData.rollNo || !registrationData.class || !registrationData.phone || !registrationData.department || !registrationData.year) {
        return res.status(400).json({ message: 'Student name, roll number, class, phone, department, and year are required' });
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

      const participant = new Participant({
        event: req.params.id,
        user: req.user,
        registrationData: registrationData,
        customAnswers: customAnswers,
        registeredAt: new Date(),
      });

      await participant.save();
      event.participants.push(participant._id);
      await event.save();
      return res.json({ message: 'Successfully registered for event' });
    }
  } catch (err) {
    console.error('Registration error:', err);
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
        'Email': user.email || 'N/A',
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

module.exports = router;
