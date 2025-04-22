const express = require('express');
const router = express.Router();
const courseController = require('../controllers/coursecontroller');
const Course = require('../Models/course.model')

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
router.get("/:id/comments", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("comments.userId", "FullName");
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json(course.comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments" });
  }
});

// Add a comment to a course
router.post("/:id/comments", async (req, res) => {
  try {
    const { text, type, username, userId } = req.body; // Add userId


    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const newComment = { text, type, username, userId }; // Include userId
    course.comments.push(newComment);
    await course.save();

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment", error: error.message });
  }
});

module.exports = router;
