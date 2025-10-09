const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  category: {
    type: String,
    required: true,
  },
  maxAttendees: {
    type: Number,
    default: null,
  },
  tags: [{
    type: String,
  }],
  prerequisites: {
    type: String,
    default: '',
  },
  contactEmail: {
    type: String,
    default: '',
  },
  allowParticipation: {
    type: Boolean,
    default: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customQuestions: [{
    question: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'textarea', 'select', 'checkbox', 'radio'],
      required: true,
    },
    options: [String], // For select, checkbox, radio types
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Event', eventSchema);
