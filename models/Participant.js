const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    default: 'default',
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  registrationData: {
    studentName: {
      type: String,
      required: true,
    },
    rollNo: {
      type: String,
      default: '',
    },
    class: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: '',
    },
    year: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    dietary: {
      type: String,
      default: null,
    },
    specialNeeds: {
      type: String,
      default: null,
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    receiveUpdates: {
      type: Boolean,
      default: false,
    },
    wantsEPass: {
      type: Boolean,
      default: false,
    },
  },
  customAnswers: [{
    questionId: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  }],
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comment: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Participant', participantSchema);
