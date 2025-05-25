const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('En-tête Authorization:', authHeader); // Debug

  if (!authHeader) {
    return res.status(401).json({ message: 'Aucun token fourni, accès refusé' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;
  console.log('Token extrait:', token); // Debug

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    console.log('Token décodé:', decoded); // Debug
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    console.error('Erreur de vérification du token:', error.message);
    res.status(401).json({ message: 'Token invalide, accès refusé' });
  }
};

module.exports = authMiddleware;