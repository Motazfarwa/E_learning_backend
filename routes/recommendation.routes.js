const express = require('express');
const router = express.Router();
const { userModel } = require('../Models/user.model');
const Course = require('../Models/course.model');
const mongoose = require('mongoose');

// Middleware to skip body parsing for GET requests
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('[GET /recommendations] User ID:', userId);

  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Find user with lean() for performance
    const user = await userModel
      .findById(userId)
      .select('profile.skills')
      .lean();

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile and skills exist
    if (!user.profile || !Array.isArray(user.profile.skills) || user.profile.skills.length === 0) {
      return res.status(200).json({ 
        message: 'No skills found in user profile',
        recommended: [] 
      });
    }

    const skills = user.profile.skills;
    console.log('User skills:', skills);

    // Find courses matching user skills
    const recommendedCourses = await Course
      .find({ requiredSkills: { $in: skills } })
      .limit(10)
      .lean();

    // Check if courses were found
    if (!recommendedCourses.length) {
      return res.status(200).json({
        message: 'No courses found matching user skills',
        recommended: [],
        userSkills: skills
      });
    }

    res.status(200).json({ 
      recommended: recommendedCourses,
      userSkills: skills 
    });
  } catch (err) {
    console.error('Error in recommendations route:', err);
    res.status(500).json({ 
      message: 'Internal server error',
      error: err.message 
    });
  }
});

// Apply express.json() only to non-GET routes (e.g., POST, PUT)
router.use((req, res, next) => {
  if (req.method === 'GET') {
    return next(); // Skip JSON parsing for GET requests
  }
  express.json()(req, res, next); // Apply JSON parsing for other methods
});

module.exports = router;