const Course = require('../Models/course.model');
const multer = require('multer');
const path = require('path');

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Create a new course
const createCourse = async (req, res) => {
  try {
    const { nom, description, requiredSkills, price, isPaid, comments } = req.body;

    // Validate required fields
    if (!nom || !description || !req.files['file'] || !req.files['courseimagefile'] || price === undefined || isPaid === undefined) {
      return res.status(400).json({ success: false, error: 'All required fields (nom, description, file, courseimagefile, price, isPaid) must be provided' });
    }

    // Parse price and isPaid
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, error: 'Price must be a non-negative number' });
    }
    const parsedIsPaid = isPaid === 'true' || isPaid === true;

    // Parse requiredSkills and comments if provided
    let parsedSkills = [];
    if (requiredSkills) {
      try {
        parsedSkills = typeof requiredSkills === 'string' ? JSON.parse(requiredSkills) : requiredSkills;
        if (!Array.isArray(parsedSkills)) throw new Error('Invalid format');
      } catch (err) {
        return res.status(400).json({ success: false, error: 'requiredSkills must be an array' });
      }
    }

    let parsedComments = [];
    if (comments) {
      try {
        parsedComments = typeof comments === 'string' ? JSON.parse(comments) : comments;
        if (!Array.isArray(parsedComments)) throw new Error('Invalid format');
        for (const comment of parsedComments) {
          if (comment.type && !['video', 'pdf'].includes(comment.type)) {
            return res.status(400).json({ success: false, error: 'Comment type must be "video" or "pdf"' });
          }
        }
      } catch (err) {
        return res.status(400).json({ success: false, error: 'Comments must be an array of valid comment objects' });
      }
    }

    // Store file paths
    const filePaths = req.files['file'].map(file => `/Uploads/${file.filename}`);
    const courseImagePath = `/Uploads/${req.files['courseimagefile'][0].filename}`;

    // Create the course
    const course = new Course({
      nom,
      description,
      file: filePaths,
      courseimagefile: courseImagePath,
      requiredSkills: parsedSkills,
      price: parsedPrice,
      isPaid: parsedIsPaid,
      comments: parsedComments
    });

    await course.save();
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ success: false, error: `Error creating course: ${err.message}` });
  }
};

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json({ success: true, data: courses });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ success: false, error: `Error fetching courses: ${err.message}` });
  }
};

// Get a single course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ success: false, error: `Error fetching course: ${err.message}` });
  }
};

// Update a course
const updateCourse = async (req, res) => {
  try {
    const { nom, description, requiredSkills, price, isPaid, comments } = req.body;

    // Build updated fields
    const updatedFields = {};
    if (nom) updatedFields.nom = nom;
    if (description) updatedFields.description = description;

    // Handle file uploads only if req.files exists
    if (req.files) {
      if (req.files['file'] && req.files['file'].length > 0) {
        updatedFields.file = req.files['file'].map(file => `/Uploads/${file.filename}`);
      }
      if (req.files['courseimagefile'] && req.files['courseimagefile'].length > 0) {
        updatedFields.courseimagefile = `/Uploads/${req.files['courseimagefile'][0].filename}`;
      }
    }

    // Handle requiredSkills
    if (requiredSkills !== undefined) {
      try {
        const parsedSkills = typeof requiredSkills === 'string' ? JSON.parse(requiredSkills) : requiredSkills;
        if (!Array.isArray(parsedSkills)) throw new Error('Invalid format');
        updatedFields.requiredSkills = parsedSkills;
      } catch (err) {
        return res.status(400).json({ success: false, error: 'requiredSkills must be an array' });
      }
    }

    // Handle price
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ success: false, error: 'Price must be a non-negative number' });
      }
      updatedFields.price = parsedPrice;
    }

    // Handle isPaid
    if (isPaid !== undefined) {
      updatedFields.isPaid = isPaid === 'true' || isPaid === true;
    }

    // Handle comments
    if (comments !== undefined) {
      try {
        const parsedComments = typeof comments === 'string' ? JSON.parse(comments) : comments;
        if (!Array.isArray(parsedComments)) throw new Error('Invalid format');
        for (const comment of parsedComments) {
          if (comment.type && !['video', 'pdf'].includes(comment.type)) {
            return res.status(400).json({ success: false, error: 'Comment type must be "video" or "pdf"' });
          }
        }
        updatedFields.comments = parsedComments;
      } catch (err) {
        return res.status(400).json({ success: false, error: 'Comments must be an array of valid comment objects' });
      }
    }

    // Validate that at least one field is being updated
    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update' });
    }

    const course = await Course.findByIdAndUpdate(req.params.id, updatedFields, { new: true, runValidators: true });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    res.status(200).json({ success: true, data: course });
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ success: false, error: `Error updating course: ${err.message}` });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.status(200).json({ success: true, data: { message: 'Course deleted successfully' } });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ success: false, error: `Error deleting course: ${err.message}` });
  }
};

// Download a file
const downloadFile = (req, res) => {
  const filePath = path.join(__dirname, '..', 'Uploads', req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      console.error('File download error:', err);
      res.status(404).json({ success: false, error: 'File not found or error downloading' });
    }
  });
};

// Get course statistics
const getCourseStats = async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();

    // File type distribution
    const fileTypes = await Course.aggregate([
      { $unwind: '$file' },
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: '$file', regex: '\.mp4$|\.avi$|\.mkv$', options: 'i' } },
              'video',
              {
                $cond: [
                  { $regexMatch: { input: '$file', regex: '\.pdf$', options: 'i' } },
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

    // Comments per course
    const commentsByCourse = await Course.aggregate([
      {
        $project: {
          nom: 1,
          commentCount: { $size: '$comments' }
        }
      },
      { $sort: { commentCount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        fileTypeDistribution: fileTypes,
        commentsByCourse
      }
    });
  } catch (err) {
    console.error('Error fetching course stats:', err);
    res.status(500).json({ success: false, error: `Error fetching statistics: ${err.message}` });
  }
};

module.exports = {
  upload,
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseStats,
  downloadFile
};