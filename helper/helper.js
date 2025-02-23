const { userModel } = require('../Models/user.model');

// Check if user exists by email
const checkuser = async (email) => {
  try {
    if (!email) throw new Error('Email is required');
    const user = await userModel.findOne({ email });
    return user;
  } catch (error) {
    throw error;
  }
};

module.exports = { checkuser };
