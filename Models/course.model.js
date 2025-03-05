const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  file: { type: String, required: true }, // File path
  courseimagefile: { type: String, required: true } // Image path
});

module.exports = mongoose.model('Course', CourseSchema);
