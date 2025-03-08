const Course = require('../Models/course');


exports.createCourse = async (req, res) => {
    try {
        const course = new Course(req.body);
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: "Cours non trouvé" });
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!course) return res.status(404).json({ message: "Cours non trouvé" });
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ message: "Cours non trouvé" });
        res.json({ message: "Cours supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier envoyé" });
        }

        const { title, description, instructor, price } = req.body;

        const course = new Course({
            title,
            description,
            instructor,
            price,
            fileUrl: `/uploads/${req.file.filename}` // Stocke le lien du fichier
        });

        await course.save();
        res.status(201).json({ message: "Cours ajouté avec succès", course });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};