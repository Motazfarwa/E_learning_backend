const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/user.model').userModel;
const multer = require('multer');
const path = require('path');
const { getExperts } = require('../controllers/user.controller');

// Configuration de Multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${req.user ? req.user.id : 'new-user'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seules les images JPEG/PNG sont autorisées'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5MB
});

const JWT_SECRET = process.env.JWT_SECRET || '12345';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur authMiddleware:', error.message);
    res.status(401).json({ error: 'Authentification requise', details: error.message });
  }
};

// Générer un token d'accès
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, FullName: user.FullName, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Générer un refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// GET : Liste des utilisateurs (pour admin, si nécessaire)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// POST : Inscription d'un nouvel utilisateur
router.post('/', upload.single('profileImage'), async (req, res) => {
  const { FullName, email, password, role } = req.body;
  const profileImage = req.file ? `/Uploads/${req.file.filename}` : '';
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis' });
    }
    const existingUser = await User.findOne({ email, role });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé pour ce rôle' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      FullName,
      email,
      password: hashedPassword,
      role: role || 'APPRENANT',
      profileImage,
      profile: { bio: '', skills: [], coursesEnrolled: [], coursesCreated: [] }
    });
    await user.save();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json({ user: userResponse, accessToken, refreshToken });
  } catch (error) {
    console.error('Erreur lors de la création de l’utilisateur :', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé pour ce rôle' });
    }
    res.status(400).json({ error: 'Erreur lors de la création de l’utilisateur', details: error.message });
  }
});

// POST : Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, FullName: user.FullName, email: user.email, role: user.role, profileImage: user.profileImage }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// POST : Rafraîchir le token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token requis' });
  }
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token :', error);
    res.status(401).json({ error: 'Refresh token invalide', details: error.message });
  }
});

// GET : Profil de l'utilisateur connecté
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('profile.coursesEnrolled')
      .populate('profile.coursesCreated')
      .select('-password');
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// PUT : Mettre à jour le profil
router.put('/profile', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    const { FullName, bio, skills } = req.body;
    const profileImage = req.file ? `/Uploads/${req.file.filename}` : req.body.profileImage;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mise à jour des champs
    if (FullName) user.FullName = FullName;
    if (bio) user.profile.bio = bio;
    if (skills) user.profile.skills = skills.split(',').map(skill => skill.trim());
    if (profileImage) user.profileImage = profileImage;

    await user.save();
    const updatedUser = await User.findById(req.user.id)
      .populate('profile.coursesEnrolled')
      .populate('profile.coursesCreated')
      .select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil :', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil', details: error.message });
  }
});

// DELETE : Supprimer un utilisateur
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l’utilisateur :', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la suppression de l’utilisateur',
      details: error.message,
    });
  }
});
router.get('/experts', authMiddleware, getExperts);

module.exports = router;