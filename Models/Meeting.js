const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
<<<<<<< HEAD
  learner: { type: String},  // Store learner's email
=======
  learner: { type: String },  // Store learner's email
>>>>>>> d3745ec8127e09b81e14262e3eb918764f4f9b2e
  expert: { type: String, required: true }, 
  startTime: { type: Date, required: true },
  duration: { type: Number, default: 30 }, // in minutes
  endTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined', 'completed'], 
    default: 'pending' 
  },
  meetingUrl: { type: String }, // Make it required
  meetingId: { type: String }     // For meeting identifier
});

// Add compound index for efficient querying of meetings that need to be closed
meetingSchema.index({ endTime: 1, status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);