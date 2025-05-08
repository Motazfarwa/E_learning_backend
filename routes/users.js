const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/user.model').userModel;
const multer = require('multer');
const path = require('path');

// Configuration de Multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
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

const SECRET_KEY = process.env.SECRET_KEY || '12345';
const authMiddleware = async (req, res, next) => {
  try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
          return res.status(401).send('Authentification requise');
      }

      const decoded = jwt.verify(token, SECRET_KEY); // Utilisez la même clé
    console.log('Token décodé:', decoded);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('Utilisateur non trouvé pour ID:', decoded.id);
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
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token d'accès valide 7 jours
  );
};

// Générer un refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' } // Refresh token valide 30 jours
  );
};
router.get('/', async (req, res) => {
  try {
    const courses = await User.find();
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching courses' });
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
    });
    await user.save();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json({ user: userResponse, accessToken, refreshToken });
  } catch (error) {
    console.error('Erreur lors de la création de l’utilisateur :', error);
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
      user: { id: user._id, FullName: user.FullName, email: user.email, role: user.role }
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
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
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
      .populate('profile.coursesCreated');
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// PUT : Mettre à jour le profil
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['FullName', 'profile.bio', 'profile.skills'];
    const updateKeys = Object.keys(updates);
    const isValidUpdate = updateKeys.every(
      (key) => allowedUpdates.includes(key) || key.startsWith('profile.')
    );
    if (!isValidUpdate) {
      return res.status(400).json({ error: 'Mises à jour non autorisées' });
    }
    const user = await User.findById(req.user.id);
    updateKeys.forEach((key) => {
      if (key.startsWith('profile.')) {
        const [_, field] = key.split('profile.');
        user.profile[field] = updates[key];
      } else {
        user[key] = updates[key];
      }
    });
    await user.save();
    const updatedUser = await User.findById(req.user.id)
      .populate('profile.coursesEnrolled')
      .populate('profile.coursesCreated')
      .select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil :', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// POST : Upload d'image
router.post('/upload-image', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }
    const user = await User.findById(req.user.id);
    user.profileImage = `/Uploads/${req.file.filename}`;
    await user.save();
    res.json({ imageUrl: user.profileImage });
  } catch (error) {
    console.error('Erreur lors de l’upload de l’image :', error);
    res.status(500).json({ error: 'Erreur lors de l’upload de l’image' });
  }
});
router.post('/', upload.single('profileImage') , async (req, res) => {
  const { FullName, email, password, role } = req.body;
  const profileImage = req.file ? req.file.filename : '';
  try {
    console.log('Requête POST /api/users reçue :', req.body, req.file);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis' });
    }

    // Vérifier si la combinaison email/role existe déjà
    const existingUser = await User.findOne({ email, role });
    if (existingUser) {
      console.log('Erreur : Cet email est déjà utilisé pour ce rôle', { email, role });
      return res.status(400).json({ error: 'Cet email est déjà utilisé pour ce rôle' });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      FullName,
      email,
      password: hashedPassword,
      role: role || 'apprenant',
      profileImage,
    });

    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Erreur lors de la création de l’utilisateur :', error);
    if (error.code === 11000) {
      console.log('Erreur d’index unique :', { email: req.body.email, role: req.body.role });
      return res.status(400).json({ error: 'Cet email est déjà utilisé pour ce rôle' });
    }else {
      res.status(400).json({
        error: 'Erreur lors de la création de l’utilisateur',
        details: error.message,
      });
    }
  }
});
// PUT : Mettre à jour un utilisateur
router.put('/:id', upload.single('profileImage') , async (req, res) => {

  const { FullName, email, role } = req.body;
  const profileImage = req.file ? req.file.filename : req.body.profileImage;
  try {
    console.log('Requête PUT /api/users/:id reçue :', req.body, req.file, 'ID:', req.params.id);

    // Validation
    if (!email) {
      return res.status(400).json({ error: 'L’email est requis' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { FullName, email, role, profileImage },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l’utilisateur :', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Cet email est déjà utilisé' });
    } else {
      res.status(400).json({
        error: 'Erreur lors de la mise à jour de l’utilisateur',
        details: error.message,
      });
    }
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

module.exports = router;