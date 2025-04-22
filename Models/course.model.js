const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  file: { type: [String], required: true }, // Array of file paths, // File path
  comments: [
    {
      userId: {type: String },
      type: { type: String, enum: ["video", "pdf"] }, // Type of comment
      text: String, // The comment itself
      username: String, // User who added the comment
      createdAt: { type: Date, default: Date.now } // Timestamp
    },
  ],
  courseimagefile: { type: String, required: true } // Image path
});

module.exports = mongoose.model('Course', CourseSchema);
