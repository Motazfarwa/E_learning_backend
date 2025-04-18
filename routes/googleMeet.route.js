// routes/googleMeet.route.js
const express = require('express');
const router = express.Router();
const { createMeetLink } = require('../googleMeet');

router.post('/create-meeting', async (req, res) => {
    try {
      const { startTime, endTime, emails } = req.body;
      console.log('Demande de création de meeting reçue:', { startTime, endTime, emails });
  
      const meetLink = await createMeetLink(startTime, endTime, emails);
      res.json({ meetLink });
    } catch (error) {
      console.error('❌ Erreur lors de la création du lien Google Meet:', error);
      res.status(500).json({ error: 'Erreur lors de la création du lien Google Meet' });
    }
  });
module.exports = router;
