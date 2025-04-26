const axios = require ('axios'); // Frontend (React)
// Pour le backend, utilise : const axios = require('axios');

/**
 * Vérifie si un commentaire est toxique via l'API Hugging Face.
 * @param {string} comment - Le commentaire à analyser.
 * @param {string} apiToken - Token API Hugging Face.
 * @returns {Promise<Object>} - Résultat { isToxic, message, score }.
 */
async function checkToxicity(comment, apiToken) {
  if (!comment || typeof comment !== 'string') {
    return {
      isToxic: false,
      message: 'Le commentaire ne peut pas être vide.',
      score: 0,
    };
  }

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/unitary/toxic-bert',
      { inputs: comment },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const toxicityScore = response.data[0]?.score || 0;
    const isToxic = toxicityScore > 0.7; // Seuil ajustable

    return {
      isToxic,
      message: isToxic
        ? 'Commentaire inapproprié détecté. Veuillez reformuler.'
        : 'Commentaire valide.',
      score: toxicityScore,
    };
  } catch (err) {
    console.error('Erreur API Hugging Face:', err.message);
    return {
      isToxic: false,
      message: 'Erreur lors de l\'analyse du commentaire. Veuillez réessayer.',
      score: 0,
    };
  }
}

/**
 * Filtre un commentaire : bloque si toxique.
 * @param {string} comment - Le commentaire à filtrer.
 * @param {string} apiToken - Token API Hugging Face.
 * @param {Object} options - Options de filtrage.
 * @param {boolean} options.block - Si true, bloque les commentaires toxiques.
 * @returns {Promise<Object>} - Résultat { isValid, comment, message }.
 */
async function filterComment(comment, apiToken, options = { block: true }) {
  const toxicityResult = await checkToxicity(comment, apiToken);

  if (toxicityResult.isToxic && options.block) {
    return {
      isValid: false,
      comment: null,
      message: toxicityResult.message,
    };
  }

  return {
    isValid: true,
    comment,
    message: toxicityResult.message,
  };
}

module.exports = { filterComment, checkToxicity };