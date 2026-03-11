const mongoose = require('mongoose');

const epassSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  qrCode: {
    type: String, // Data URI of QR code image
    default: null,
  },
  status: {
    type: String,
    enum: ['generated', 'sent', 'verified', 'used', 'cancelled'],
    default: 'generated',
  },
  sentAt: {
    type: Date,
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  pdfUrl: {
    type: String,
    default: null,
  },
  tenantId: {
    type: String,
    required: true,
    default: 'default',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on every save
epassSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EPass', epassSchema);
