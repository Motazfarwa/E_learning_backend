const Course = require('../Models/course.model');
const multer = require('multer');
const path = require('path');

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Create a new course
const createCourse = async (req, res) => {
  try {
    const { nom, description, requiredSkills, price } = req.body;
    const isPaid = price > 0;

    // Validate required fields
    if (!nom || !description || !req.files['file'] || !req.files['courseimagefile']) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Process files
    const files = req.files['file'].map(file => file.filename);
    const courseImage = req.files['courseimagefile'][0].filename;

    // Create course with all fields
    const course = new Course({
      nom,
      description,
      file: files,
      courseimagefile: courseImage,
      requiredSkills: requiredSkills ? JSON.parse(requiredSkills) : [],
      price: parseFloat(price) || 0,
      isPaid
    });

    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating course', error: err.message });
  }
};

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching courses', error: err.message });
  }
};

// Get course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching course', error: err.message });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { nom, description, requiredSkills, price } = req.body;
    const isPaid = price > 0;

    const updateData = {
      nom,
      description,
      requiredSkills: requiredSkills ? JSON.parse(requiredSkills) : [],
      price: parseFloat(price) || 0,
      isPaid
    };

    // Handle file updates if provided
    if (req.files['file']) {
      updateData.file = req.files['file'].map(file => file.filename);
    }
    if (req.files['courseimagefile']) {
      updateData.courseimagefile = req.files['courseimagefile'][0].filename;
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course updated successfully', course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating course', error: err.message });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting course', error: err.message });
  }
};

// Download file
const downloadFile = (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    res.download(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error downloading file', error: err.message });
  }
};

// Get course statistics
const getCourseStats = async (req, res) => {
  try {
    // Total courses count
    const totalCourses = await Course.countDocuments();
    
    // Paid vs free courses
    const paidCourses = await Course.countDocuments({ isPaid: true });
    const freeCourses = totalCourses - paidCourses;
    
    // File type distribution
    const fileTypes = await Course.aggregate([
      { $unwind: '$file' },
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: '$file', regex: /\.(mp4|avi|mkv)$/i } },
              'video',
              {
                $cond: [
                  { $regexMatch: { input: '$file', regex: /\.pdf$/i } },
                  'pdf',
                  'other'
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Comments statistics
    const commentsStats = await Course.aggregate([
      {
        $project: {
          nom: 1,
          commentCount: { $size: '$comments' }
        }
      },
      { $sort: { commentCount: -1 } },
      {
        $group: {
          _id: null,
          totalComments: { $sum: '$commentCount' },
          avgComments: { $avg: '$commentCount' },
          topCourses: { $push: { name: '$nom', count: '$commentCount' } }
        }
      },
      { $limit: 5 }
    ]);

    res.json({
      totalCourses,
      paidCourses,
      freeCourses,
      fileTypeDistribution: fileTypes,
      commentsStats: commentsStats[0] || {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error getting statistics', error: err.message });
  }
};

module.exports = {
  upload,
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  downloadFile,
  getCourseStats
};