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
    const { nom, description } = req.body;

    // Ensure all required fields are provided
    if (!nom || !description || !req.files['file'] || !req.files['courseimagefile']) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // If there are multiple files, we store all their filenames
    const files = req.files['file'].map((file) => file.filename);

    // Create the course and store multiple file paths
    const course = new Course({
      nom,
      description,
      file: files, // Store all file paths
      courseimagefile: req.files['courseimagefile'][0].filename, // Only one image
    });

    await course.save();
    res.status(201).json({ message: 'Course added successfully', course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding course' });
  }
};


// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching courses' });
  }
};

// Get a single course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching course details' });
  }
};

// Update a course
const updateCourse = async (req, res) => {
  try {
    const { nom, description } = req.body;
    if (!nom || !description) return res.status(400).json({ message: 'Name and description are required' });

    const updatedFields = { nom, description };
    if (req.files['file']) updatedFields.file = req.files['file'][0].filename;
    if (req.files['courseimagefile']) updatedFields.courseimagefile = req.files['courseimagefile'][0].filename;

    const course = await Course.findByIdAndUpdate(req.params.id, updatedFields, { new: true });

    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json({ message: 'Course updated successfully', course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating course' });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json({ message: 'Course deleted successfully', course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting course' });
  }
};

// Download a file
const downloadFile = (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      console.error('File download error:', err);
      res.status(500).json({ message: 'Error downloading file' });
    }
  });
};




module.exports = {
  upload,
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  downloadFile
};
