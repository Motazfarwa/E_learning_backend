const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../Models/user.model').userModel;

// GET : Lister tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    console.log('Requête GET /api/users reçue');
    const users = await User.find().select('-password');
    console.log('Utilisateurs récupérés :', users.length);
    res.status(200).json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération des utilisateurs',
      details: error.message,
    });
  }
});

// POST : Créer un nouvel utilisateur
router.post('/', async (req, res) => {
  try {
    const { FullName, email, password, role, profileImage } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis' });
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
      res.status(400).json({ error: 'Cet email est déjà utilisé' });
    } else {
      res.status(400).json({
        error: 'Erreur lors de la création de l’utilisateur',
        details: error.message,
      });
    }
  }
});

// PUT : Mettre à jour un utilisateur
router.put('/:id', async (req, res) => {
  try {
    const { FullName, email, role, profileImage } = req.body;

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