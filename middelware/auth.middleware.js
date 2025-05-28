const jwt = require('jsonwebtoken');
const User = require('../Models/user.model');

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id); // Adjust according to your payload
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Token invalide.' });
  }
};
