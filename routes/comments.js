const express = require('express');
const router = express.Router();
const Comment = require('../Models/comment.model').commentModel;

// Liste des mots inappropriés
const badWords = ['idiot', 'stupide', 'nul', 'mauvais', 'débile']; // À personnaliser

// Fonction pour filtrer les bad words
const filterBadWords = (text) => {
  const words = text.toLowerCase().split(' ');
  const filteredWords = words.map((word) => {
    return badWords.includes(word) ? '*****' : word;
  });
  return filteredWords.join(' ');
};

// POST : Créer un commentaire
router.post('/', async (req, res) => {
  const { userId, content } = req.body;

  try {
    console.log('Requête POST /api/comments reçue :', { userId, content });

    // Validation
    if (!userId || !content) {
      console.log('Erreur : userId ou content manquant', { userId, content });
      return res.status(400).json({ error: 'userId et content sont requis' });
    }

    // Filtrer les bad words
    const filteredContent = filterBadWords(content);
    console.log('Commentaire filtré :', filteredContent);

    const comment = new Comment({
      userId,
      content: filteredContent,
    });

    await comment.save();
    console.log('Commentaire créé avec succès :', comment);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Erreur lors de la création du commentaire :', error);
    res.status(400).json({
      error: 'Erreur lors de la création du commentaire',
      details: error.message,
    });
  }
});

// GET : Lister tous les commentaires
router.get('/', async (req, res) => {
  try {
    console.log('Requête GET /api/comments reçue');
    const comments = await Comment.find().populate('userId', 'FullName email');
    console.log('Commentaires récupérés :', comments.length);
    res.status(200).json(comments);
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires :', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération des commentaires',
      details: error.message,
    });
  }
});

module.exports = router;