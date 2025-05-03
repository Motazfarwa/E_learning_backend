
const express = require('express');
const { manager } = require('../Models/ToxicityModel');
const router = express.Router();

router.post('/check', async (req, res) => {
    console.log('Request received'); // Add this
    try {
      const { text } = req.body;
      console.log('Processing text:', text); // Add this
      const response = await manager.process('fr', text);
      console.log('Response from NLP:', response); // Add this
      
      const isToxic = response.intent === 'toxic' || 
                     response.entities.some(e => e.entity === 'insulte');
  
      res.json({
        text,
        isToxic,
        score: isToxic ? 0.9 : 0.1,
        entities: response.entities
      });
    } catch (error) {
      console.error('Error:', error); // Add this
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router; 
