const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
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
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
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
