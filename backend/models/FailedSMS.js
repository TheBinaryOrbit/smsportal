const mongoose = require('mongoose');

const failedSMSSchema = new mongoose.Schema({
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
  error: {
    type: String,
    required: true
  },
  finalFailureAt: {
    type: Date,
    default: Date.now
  },
  retryAttempts: {
    type: Number,
    default: 3
  },
  parentSMSQueueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SMSQueue',
    required: true
  }
});

// Index for efficient querying
failedSMSSchema.index({ type: 1 });
failedSMSSchema.index({ finalFailureAt: -1 });
failedSMSSchema.index({ phone: 1 });

module.exports = mongoose.model('FailedSMS', failedSMSSchema);
