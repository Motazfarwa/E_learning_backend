// routes/chat.js
const express = require('express');
const router = express.Router();
const Message = require('../Models/Message');
const passport = require('passport');

// Récupérer les messages d'une salle
router.get('/:roomId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ timestamp: 1 })
      .lean();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

module.exports = router;