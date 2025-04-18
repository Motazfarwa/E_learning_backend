const multer = require("multer");
const path = require("path");

// Définir le stockage des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Dossier où enregistrer les fichiers
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Renomme le fichier
    }
});

// Vérifier le type de fichier (PDF, Word, Vidéo)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["application/pdf", "application/msword", 
                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                          "video/mp4", "video/mpeg"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Format de fichier non autorisé"), false);
    }
};

// Initialiser `multer`
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Limite de 50 Mo
    fileFilter: fileFilter
});

module.exports = upload;