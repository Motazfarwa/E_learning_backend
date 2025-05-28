const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  file: { type: [String], required: true }, // Array of file paths
  comments: [
    {
      userId: { type: String },
      type: { type: String, enum: ['video', 'pdf'] },
      text: String,
      username: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  courseimagefile: { type: String, required: true }, // Image path
  requiredSkills: [{ type: String }],
  price: { 
    type: Number, 
    required: true, 
    default: 0, // Free courses have price 0
    min: 0 // Ensure price is non-negative
  },
  isPaid: { 
    type: Boolean, 
    required: true, 
    default: false // Free by default
  },
});

module.exports = mongoose.models.Course || mongoose.model('Course', CourseSchema);