const express = require('express');
const router = express.Router();
const courseController = require('../controllers/coursecontroller');
const Course = require('../Models/course.model');

const tf = require('@tensorflow/tfjs');
const toxicity = require('@tensorflow-models/toxicity');
const { manager } = require('../Models/ToxicityModel');

// Apply multer middleware for file uploads
router.post(
  '/courses',
  courseController.upload.fields([{ name: 'file', maxCount: 5 }, { name: 'courseimagefile', maxCount: 1 }]),
  courseController.createCourse
);


// Charger le modèle (100% JS)
router.post('/api/toxicity', async (req, res) => {
  const { text } = req.body;
  const model = await toxicity.load(0.85); // Seuil à 85%
  const predictions = await model.classify([text]);
  res.json(predictions);
});
router.get('/courses', courseController.getAllCourses);
router.get('/courses/stats', courseController.getCourseStats);
router.get('/courses/:id', courseController.getCourseById);
router.put(
  '/courses/:id',
  courseController.upload.fields([{ name: 'file', maxCount: 1 }, { name: 'courseimagefile', maxCount: 1 }]),
  courseController.updateCourse
);
router.delete('/courses/:id', courseController.deleteCourse);

router.get('/download/:filename', courseController.downloadFile);

// Get comments for a course
router.get('/courses/:id/comments', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('comments.userId', 'FullName');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json(course.comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

// Add a comment to a course
router.post('/courses/:id/comments', async (req, res) => {
  try {
    const { text, type, username, userId } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const response = await manager.process('fr', text);

    const isToxic = response.intent === 'toxic' || 
                    response.entities.some(e => e.entity === 'insulte');

    if (isToxic) {
      return res.status(400).json({
        message: 'Your comment contains toxic content '
      });
    }

    const newComment = {
      text,
      type,
      username,
      userId,
      createdAt: new Date()
    };

    course.comments.push(newComment);
    await course.save();

    res.status(201).json({ message: 'Comment added successfully', comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});


module.exports = router;
