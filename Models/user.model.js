const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  FullName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'APPRENANT', 'INSTRUCTEUR', 'EXPERT'],
    default: 'APPRENANT',
  },
  profileImage: { type: String },
  profile: {
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    coursesEnrolled: [{ type: Schema.Types.ObjectId, ref: 'Course' }], // For APPRENANT
    coursesCreated: [{ type: Schema.Types.ObjectId, ref: 'Course' }], // For INSTRUCTEUR/EXPERT
  },
  createdAt: { type: Date, default: Date.now },
  purchasedCourses: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
  ],
});

// Remove unique index on { email: 1, role: 1 } if email should be unique regardless of role
userSchema.index({ email: 1 }, { unique: true });

// Prevent model overwrite
module.exports = mongoose.models.usermodel || mongoose.model('users', userSchema);