const express = require('express');
const router = express.Router();
const User = require('../Models/user.model');
const Course = require('../Models/course.model');
const authMiddleware = require('../middelware/auth.middleware');

router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('profile.skills profile.coursesEnrolled');
    console.log('Utilisateur trouvé:', user);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const userSkills = user.profile.skills || [];
    const enrolledCourses = user.profile.coursesEnrolled || [];
    console.log('Compétences utilisateur:', userSkills);
    console.log('Cours suivis:', enrolledCourses);

    const courses = await Course.find();
    console.log('Cours trouvés:', courses);

    const recommendations = courses
      .filter(course => !enrolledCourses.includes(course._id))
      .map(course => {
        const courseSkills = course.requiredSkills || [];
        const commonSkills = userSkills.filter(skill => courseSkills.includes(skill));
        const score = commonSkills.length;
        console.log(`Cours: ${course.nom}, Compétences communes: ${commonSkills}, Score: ${score}`);
        return { course, score };
      });

    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.course);

    console.log('Recommandations finales:', sortedRecommendations);
    res.json(sortedRecommendations);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;