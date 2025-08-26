const mongoose = require('mongoose');

const smsQueueSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['attendance', 'salary']
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  data: {
    // For attendance: { date, status }
    // For salary: { amount }
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  error: {
    type: String
  },
  response: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  }
});

// Index for efficient querying
smsQueueSchema.index({ type: 1, status: 1 });
smsQueueSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SMSQueue', smsQueueSchema);
