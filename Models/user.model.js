const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  FullName: String,
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['ADMIN', 'APPRENANT', 'INSTRUCTEUR', 'EXPERT'],
    default: 'APPRENANT',
  },
  profileImage: String,
  profile: {
    bio: { type: String, default: '' },
    skills: [String],
    coursesEnrolled: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    coursesCreated: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  },
  createdAt: { type: Date, default: Date.now },
  purchasedCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
});


// Index for unique combination of email + role
userSchema.index({ email: 1, role: 1 }, { unique: true });

// Create the model
const userModel = mongoose.models.users || mongoose.model('users', userSchema);

// Export as object
module.exports = {
  userModel,
};

