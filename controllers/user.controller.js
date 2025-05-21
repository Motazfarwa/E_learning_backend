const User = require('../Models/user.model');

const getExperts = async (req, res) => {
  try {
    const experts = await User.find({ role: { $in: ['EXPERT', 'INSTRUCTEUR'] } })
      .select('FullName profileImage profile.bio profile.skills');
    res.status(200).json({
      success: true,
      data: { experts },
    });
  } catch (error) {
    console.error('Error fetching experts:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};
module.exports = { getExperts };