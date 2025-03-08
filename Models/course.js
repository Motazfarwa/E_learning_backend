const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructor: { type: String, required: true },
    price: { type: Number, required: true },
    fileUrl: { type: String }, 
}, { timestamps: true }
);


module.exports = mongoose.model('Course', CourseSchema);