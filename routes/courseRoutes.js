const express = require('express');
const router = express.Router();
const courseController = require('../controllers/coursecontroller');

// Apply multer middleware for file uploads
router.post(
  '/courses',
  courseController.upload.fields([{ name: 'file', maxCount: 1 }, { name: 'courseimagefile', maxCount: 1 }]),
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

module.exports = router;
