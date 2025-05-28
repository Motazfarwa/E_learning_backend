const express = require('express');
const router = express.Router();
const User = require('../Models/user.model');
const Course = require('../Models/course.model');

router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.query.userId; // 👈 Get userId from query param

    const user = await User.findById(userId)
      .select('role profile.skills profile.coursesEnrolled profile.coursesCreated')
      .populate('profile.coursesEnrolled')
      .populate('profile.coursesCreated');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const userSkills = user.profile.skills || [];

    if (user.role === 'APPRENANT') {
      const enrolledCourseIds = user.profile.coursesEnrolled.map(course => course._id.toString());

      const allCourses = await Course.find();

      const recommendations = allCourses
        .filter(course => !enrolledCourseIds.includes(course._id.toString()))
        .map(course => {
          const courseSkills = course.requiredSkills || [];
          const commonSkills = userSkills.filter(skill => courseSkills.includes(skill));
          const score = commonSkills.length;
          return { course, score };
        });

      const sorted = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.course);

      return res.json(sorted);
    }

    if (['INSTRUCTEUR', 'EXPERT'].includes(user.role)) {
      const createdCourseIds = user.profile.coursesCreated.map(course => course._id.toString());

      const allCourses = await Course.find({
        _id: { $nin: createdCourseIds },
        requiredSkills: { $in: userSkills },
      });

      return res.json(allCourses.slice(0, 5));
    }

    res.json([]);

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
