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
  endDate: {
    type: Date,
    default: null,
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
  tenantId: {
    type: String,
    required: true,
    default: 'default',
  },
  tenantName: {
    type: String,
    default: 'General',
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
  requiresPayment: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'AUD'],
  },
  earlyBirdPrice: {
    type: Number,
    default: null,
    min: 0,
  },
  earlyBirdDeadline: {
    type: Date,
    default: null,
  },
  requiresApproval: {
    type: Boolean,
    default: false,
  },
  registrationDeadline: {
    type: Date,
    default: null,
  },
  contactPhone: {
    type: String,
    default: '',
  },
  website: {
    type: String,
    default: '',
  },
  schedule: [{
    title: String,
    time: String,
    description: String,
  }],
  enableEPass: {
    type: Boolean,
    default: false,
  },
  brandColorPrimary: {
    type: String,
    default: '#667eea', // Default purple
  },
  brandColorSecondary: {
    type: String,
    default: '#764ba2', // Default secondary
  },
  brandAccent: {
    type: String,
    default: '#ffffff', // Default white accent
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Event', eventSchema);
