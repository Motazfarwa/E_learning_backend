const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const upload = require("../middelware/upload");

router.post('/', courseController.createCourse);
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);
router.post("/upload", upload.single("file"), courseController.uploadFile);

module.exports = courseRoutes ;