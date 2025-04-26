const express = require('express');
const router = express.Router();
const courseController = require('../controllers/coursecontroller');
const Course = require('../Models/course.model');
const { filterComment } = require('../utils/ToxicityFilter');

// Apply multer middleware for file uploads
router.post(
  '/courses',
  courseController.upload.fields([{ name: 'file', maxCount: 5 }, { name: 'courseimagefile', maxCount: 1 }]),
  courseController.createCourse
);
router.get('/courses', courseController.getAllCourses);
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

    // Filtrer la toxicité
    const result = await filterComment(text, process.env.HUGGING_FACE_TOKEN, { block: true });
    if (!result.isValid) {
      return res.status(400).json({ message: result.message });
    }

    const newComment = { text: result.comment, type, username, userId };
    course.comments.push(newComment);
    await course.save();

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

module.exports = router;
