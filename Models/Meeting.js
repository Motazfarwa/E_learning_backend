const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  expert: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  startTime: { type: Date, required: true },
  duration: { type: Number, default: 30 }, // in minutes
  endTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed'], 
    default: 'scheduled' 
  },
  meetingUrl: { type: String, required: true }, // Make it required
  meetingId: { type: String, unique: true }     // For meeting identifier
});

// Add compound index for efficient querying of meetings that need to be closed
meetingSchema.index({ endTime: 1, status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);